// @ts-ignore
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    console.log("request.action: ", request.action)
    if (request.action === "getDocumentTextContent") {
        sendResponse(document.body.innerText);
    }
});