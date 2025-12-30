chrome.runtime.onMessage.addListener((request: { action: string}, _sender: unknown, sendResponse: (str: string) => void) => {
    console.log("request.action: ", request.action)
    switch(request.action) {
        case "getDocumentTextContent":
            sendResponse(document.body.innerText);
            break;
    }
});