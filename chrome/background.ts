enum ContextMenuAction {
  GENERATE_LLM_RESPONSE_WITH_CONTEXT_ACTION = "generate-llm-response",
  GENERATE_LLM_RESPONSE_NO_CONTEXT_ACTION = "generate-llm-response-no-context",
  GENERATE_LLM_RESPONSE_FROM_DOM = "generate-llm-response-dom",
}

const SUMMARY_AGENT_HEADER = `You are a text summarization tool designed to condense large volumes of text into concise, informative summaries.
  Your goal is to efficiently extract key information, main ideas, and critical details, allowing users to quickly understand the core content of the text without needing to read the entire document.`;

// @ts-ignore
chrome.runtime.onInstalled.addListener(() => {
  // @ts-ignore
  chrome.contextMenus.create({
    id: ContextMenuAction.GENERATE_LLM_RESPONSE_WITH_CONTEXT_ACTION,
    title: "Include context and generate response for selected text",
    contexts: ["selection"] // Only show when text is highlighted
  });
  // @ts-ignore
  chrome.contextMenus.create({
    id: ContextMenuAction.GENERATE_LLM_RESPONSE_NO_CONTEXT_ACTION,
    title: 'Generate response for selected text',
    contexts: ['selection'] // Only show when text is highlighted
  });
  // @ts-ignore
  chrome.contextMenus.create({
    id: ContextMenuAction.GENERATE_LLM_RESPONSE_FROM_DOM,
    title: 'Generate response for DOM content',
    contexts: ['all']
  });
});

const updateTextDisplay = (text: string) => {
  if(text) {
    // @ts-ignore
    chrome.storage.local.set({'llm-response': text});
  }
}

const parseModelResponse = (response: string) => {
  try {
    return JSON.parse(response).response;
  } catch(e) {
    console.error("Error parsing LLM response: ", e, response);
  }
  return "";
}

const definePrompt = async (prompt: string, context: string, action: ContextMenuAction, tabId: number) => {
  switch(action) {
    case ContextMenuAction.GENERATE_LLM_RESPONSE_NO_CONTEXT_ACTION:
      return prompt;
    case ContextMenuAction.GENERATE_LLM_RESPONSE_WITH_CONTEXT_ACTION:
      return `[Context]:\n${context}\n[Prompt]:[\n]${prompt}`;
    case ContextMenuAction.GENERATE_LLM_RESPONSE_FROM_DOM:
      // @ts-ignore
      const response = await chrome.tabs.sendMessage(tabId, { action: "getDocumentTextContent" });
      return `[Context]:\n${context ?? SUMMARY_AGENT_HEADER}\n[Prompt]:[\n]${response ?? prompt}`;
  }
}
const consumeStreamAsync = async (response: Response) => {
  try {
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
  } catch (_e) {
    console.warn("Exiting early, likely due to closed popup")
  }
}
// @ts-ignore
chrome.contextMenus.onClicked.addListener((info, tab) => {
  try {
    if (Object.values(ContextMenuAction).includes(info.menuItemId) && (info.selectionText || info.menuItemId === ContextMenuAction.GENERATE_LLM_RESPONSE_FROM_DOM)) {
      // @ts-ignore
      chrome.storage.local.set({'llm-response': '', 'prompt-error': false});
      // @ts-ignore
      chrome.windows.create({
        // @ts-ignore
        url: chrome.runtime.getURL("popup.html"),
        type: "popup",
        focused: true,
        width: 750,
        height: 1000
      });
      // @ts-ignore
      chrome.storage.local.get(['prompt-context', 'model-name', 'port'], async (result: Record<string, string>) => {
        const prompt = await definePrompt(info.selectionText, result['prompt-context'] ?? '', info.menuItemId, tab.id);
        // @ts-ignore
        chrome.storage.local.set({'prompt': info.menuItemId === ContextMenuAction.GENERATE_LLM_RESPONSE_FROM_DOM ? info.selectionText : 'Full DOM text content'});
        fetch(`http://localhost:${result['port'] ?? '11434'}/api/generate`, { method: 'POST', body: JSON.stringify({
            "model": result['model-name'] ?? "llama3",
            "prompt": prompt,
          })})
            .then(consumeStreamAsync)
            .catch(error => {
              // @ts-ignore
              chrome.storage.local.set({'prompt-error': true});
              console.error('Error:', error);
            });
      });
    }
  } catch (error) {
    // @ts-ignore
    chrome.storage.local.set({'prompt-error': true});
    console.error('Error:', error);
  }
});