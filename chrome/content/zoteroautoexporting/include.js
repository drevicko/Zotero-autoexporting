// Only create main object once
if (!Zotero.AutoExporting) {
	var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(Components.interfaces.nsISupports).wrappedJSObject;

}
