	Zotero.AutoExporting = {
		boolLog: true,
		boolActivated:true,
		prefManager:null,
		notifierID :null,
		active:null,
		intInterval: 1,
		filepath:null,
		init: function ()
			{
			this.prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			
				//check whether we show debugs or not
				var temp = this.prefManager.getBoolPref("extensions.zoteroautoexporting.showdebug");
				if(temp==true)
					{
					this.boolLog=true;
					}
				var temp = this.prefManager.getBoolPref("extensions.zoteroautoexporting.deactivate");
				if(temp==true)
					{
					this.boolActivated=false;
					}
				var temp = this.prefManager.getCharPref("extensions.zoteroautoexporting.filepath");
				if(temp.length<3)
					{
					this.boolActivated=false;
					this.log('Looks not like a valid path.. Sorry');
					}
				else
					{
					this.filepath=temp;
					}
				var temp = this.prefManager.getIntPref("extensions.zoteroautoexporting.interval");
				if(temp<1)
					{
					this.boolActivated=false;
					this.log('Looks not like a valid interval.. ');
					}
				else
					{
					this.intInterval=temp;
					}
				
				setTimeout(function () { Zotero.AutoExporting.autoexport(); } , this.intInterval * 60 * 1000);
				
				this.log('init done');
		
			},
		check: function(aEvent)
			{
			
			}
		,
		autoexport: function ()
			{
			
			//now try to run the translator
			this.log('Run autoexporting');
			//try
				//{
				//create the new web translator
				//var translator = new Zotero.Translate.Web(); 
				var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
				//file.initWithPath('C:\\Users\\rokdd\\Downloads\\test.bib');
				file.initWithPath(this.filepath);

				this.log('translator inits');
				//var translatorObj = new Zotero.Translate.Export();
				var translatorObj = new Zotero.Translate('export');
				translatorObj.setLocation(file);
				translatorObj.setTranslator('9cb70025-a888-4a29-a210-93ec52da40d4');
				this.log('translator runs');
				translatorObj.translate();
				setTimeout(function () { Zotero.AutoExporting.autoexport(); } , this.intInterval * 60 * 1000);
			},
		
		log: function (msg) {
		if(this.boolLog==true)
			{
			 var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		   consoleService.logStringMessage(msg);
		   }
    }
	};

if (!Zotero.AutoExporting) {
	var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(Components.interfaces.nsISupports).wrappedJSObject;

}
Zotero.AutoExporting.init();