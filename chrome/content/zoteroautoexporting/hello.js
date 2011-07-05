	Zotero.AutoExporting = {
		boolLog: true,
		boolActivated:true,
		prefManager:null,
		notifierID :null,
		active:null,
		fileintInterval: 1,
		filepath:null,
		fileTimer:null,
		init:function()
			{
			this.renew();
			},
		reload:function()
			{
			clearTimeout(this.fileTimer);
			this.log('cleared timeout');
			this.renew();
			},
		renew: function ()
			{
			this.prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
				//check whether we show debugs or not
				var temp = this.prefManager.getBoolPref("extensions.zoteroautoexporting.showdebug");
				if(temp==true)
					{
					this.boolLog=true;
					}
				var temp = this.prefManager.getBoolPref("extensions.zoteroautoexporting.filedeactivate");
				if(temp==true)
					{
					this.boolActivated=false;
					this.log('Autoexporting for files is disbaled');
					}
				var temp = this.prefManager.getCharPref("extensions.zoteroautoexporting.filepath");
				
				if(temp.length>4)
					{
					this.log('Filepath seems good');
					this.filepath=temp;
					}
				else
					{
					this.boolActivated=false;
					this.log('Looks not like a valid path.. Sorry');
					}
		
				var temp = this.prefManager.getIntPref("extensions.zoteroautoexporting.fileinterval");
				if(temp<1)
					{
					this.boolActivated=false;
					this.log('Looks not like a valid interval.. ');
					return false;
					}
				else
					{
					this.fileintInterval=temp;
					}
				if(this.boolActivated==false)
					{
					this.log('Abort init process and set no timer');
					return false;
					}
				else
					{
					this.fileTimer=setTimeout(function () { Zotero.AutoExporting.autoexport(); } , this.fileintInterval * 60 * 1000);
					}
				this.log('init done');
		
			},
		autoexport: function ()
			{
			this.log('Run autoexporting');
			//var translator = new Zotero.Translate.Web(); 

				var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
				file.initWithPath(this.filepath);
				
				this.log('translator inits');
				
				var expTranslator = new Zotero.Translate('export');
				expTranslator.setLocation(file);
				expTranslator.setTranslator('9cb70025-a888-4a29-a210-93ec52da40d4');
				this.log('translator runs');
				expTranslator.translate();
				var currentTime = new Date();
				this.prefManager.setCharPref("extensions.zoteroautoexporting.filestatus",'Exported  '+currentTime.getDate()+'.'+(currentTime.getMonth() + 1)+'.'+currentTime.getFullYear()+'  '+currentTime.getHours()+':'+currentTime.getMinutes());
				this.fileTimer=setTimeout(function () { Zotero.AutoExporting.autoexport(); } , this.fileintInterval * 60 * 1000);
			},
		
		log: function (msg) {
		if(this.boolLog==true)
			{
			 var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		   consoleService.logStringMessage('[zoteroautoexporting] '+msg);
		   }
    }
	};
	
if (!Zotero.AutoExporting) {
	var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(Components.interfaces.nsISupports).wrappedJSObject;

}
Zotero.AutoExporting.init();

var myPrefObserver = {
  register: function() {
    // First we'll need the preference services to look for preferences.
    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                                .getService(Components.interfaces.nsIPrefService);

    // For this._branch we ask that the preferences for extensions.myextension. and children
    this._branch = prefService.getBranch("extensions.zoteroautoexporting.");

    // Now we queue the interface called nsIPrefBranch2. This interface is described as:  
    // "nsIPrefBranch2 allows clients to observe changes to pref values."
    this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);

    // Finally add the observer.
    this._branch.addObserver("", this, false);
  },

  unregister: function() {
    if (!this._branch) return;
    this._branch.removeObserver("", this);
  },

  observe: function(aSubject, aTopic, aData) {
    if(aTopic = "nsPref:changed")
    {
    Zotero.AutoExporting.reload();
    }
  }
}
myPrefObserver.register();
