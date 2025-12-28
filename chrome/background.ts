declare var chrome: any;

enum ContextMenuAction {
  GENERATE_LLM_RESPONSE_WITH_CONTEXT_ACTION = "generate-llm-response",
  GENERATE_LLM_RESPONSE_NO_CONTEXT_ACTION = "generate-llm-response-no-context",
  GENERATE_LLM_RESPONSE_FROM_DOM = "generate-llm-response-dom",
}

const SUMMARY_AGENT_HEADER = `You are a text summarization tool designed to condense large volumes of text into concise, informative summaries.
  Your goal is to efficiently extract key information, main ideas, and critical details, allowing users to quickly understand the core content of the text without needing to read the entire document.`;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: ContextMenuAction.GENERATE_LLM_RESPONSE_WITH_CONTEXT_ACTION,
    title: "Include context and generate response for selected text",
    contexts: ["selection"] // Only show when text is highlighted
  });
  chrome.contextMenus.create({
    id: ContextMenuAction.GENERATE_LLM_RESPONSE_NO_CONTEXT_ACTION,
    title: 'Generate response for selected text',
    contexts: ['selection'] // Only show when text is highlighted
  });
  chrome.contextMenus.create({
    id: ContextMenuAction.GENERATE_LLM_RESPONSE_FROM_DOM,
    title: 'Generate response for DOM content',
    contexts: ['all']
  });
});

const updateTextDisplay = (text: string) => {
  if(text) {
    chrome.storage.local.set({'llm-response': text});
  }
}

const parseModelResponse = (response: string)  => {
  try {
    return response ? JSON.parse(response).response : '';
  } catch(e) {
    throw new Error(`Error parsing LLM response: ${e} ${response}`);
  }
}

const definePrompt = async (prompt: string, context: string, action: ContextMenuAction, tabId: number) => {
  switch(action) {
    case ContextMenuAction.GENERATE_LLM_RESPONSE_NO_CONTEXT_ACTION:
      return prompt;
    case ContextMenuAction.GENERATE_LLM_RESPONSE_WITH_CONTEXT_ACTION:
      return `[Context]:\n${context}\n[Prompt]:\n${prompt}`;
    case ContextMenuAction.GENERATE_LLM_RESPONSE_FROM_DOM:
      const response = await chrome.tabs.sendMessage(tabId, { action: "getDocumentTextContent" });
      return `[Context]:\n${context ?? SUMMARY_AGENT_HEADER}\n[Prompt]:\n${response ?? prompt}`;
  }
}
const consumeStreamAsync = async (response: Response) => {
  const stream = response.body;
  if (!stream) {
    console.error("Response body is not a readable stream");
    return;
  }
  const decoder = new TextDecoder();
  let result = '';

  for await (const chunk of stream) {
    result += parseModelResponse(decoder.decode(chunk, { stream: true }));
    updateTextDisplay(result);
  }
  updateTextDisplay(result + parseModelResponse(decoder.decode()));
}
chrome.contextMenus.onClicked.addListener((info: any, tab: any) => {
  try {
    if (Object.values(ContextMenuAction).includes(info.menuItemId) && (info.selectionText || info.menuItemId === ContextMenuAction.GENERATE_LLM_RESPONSE_FROM_DOM)) {
      chrome.storage.local.set({'llm-response': '', 'prompt-error': false});
      chrome.windows.create({
        url: chrome.runtime.getURL("response.html"),
        type: "popup",
        focused: true,
        width: 750,
        height: 1000
      });
      chrome.storage.local.get(['prompt-context', 'model-name', 'port'], async (result: Record<string, string>) => {
        const prompt = await definePrompt(info.selectionText, result['prompt-context'] ?? '', info.menuItemId, tab.id);
        chrome.storage.local.set({'prompt': info.menuItemId !== ContextMenuAction.GENERATE_LLM_RESPONSE_FROM_DOM ? info.selectionText : 'Review the content of the current page'});
        console.log("request: ", `http://localhost:${result['port'] ?? '11434'}/api/generate`, { method: 'POST', body: JSON.stringify({
            "model": result['model-name'] ?? "llama3",
            "prompt": prompt,
          })});
        fetch(`http://localhost:${result['port'] ?? '11434'}/api/generate`, { method: 'POST', body: JSON.stringify({
            "model": result['model-name'] ?? "llama3",
            "prompt": prompt,
          })})
            .then(res => {
              console.log("Received response: ",  res);
              if(res.status === 403) {
                console.error('There was a CORS error when attempting to communicate with the LLM.');
                chrome.storage.local.set({'prompt-error': true});
              } else {
                consumeStreamAsync(res);
              }
            })
            .catch(error => {
              console.log("Setting error to true")
              chrome.storage.local.set({'prompt-error': true});
              console.error('Error:', error);
            });
      });
    }
  } catch (error) {
    console.log("Setting error to true")
    chrome.storage.local.set({'prompt-error': true});
    console.error('Error:', error);
  }
});