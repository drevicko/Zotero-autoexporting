	
if ("undefined" == typeof(Zotero)) {
	var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(Components.interfaces.nsISupports).wrappedJSObject;
}
if("undefined" == typeof(Zotero.AutoExporting))
	{
	Zotero.AutoExporting = {
		boolLog: true,
		boolActivated:true,
		prefManager:null,
		active:null,
		fileintInterval: 1,
		filepath:null,
		filetranslator:null,
		observerPref:null,
		fileTimer:null,
		Prefs:{
			},
		init:function()
			{
			//init the pref observer to get a notice when prefs changed and timer can be reseted
			this.observerPref={
				  register: function() {
					var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
					this._branch = prefService.getBranch("extensions.zoteroautoexporting.");
					this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
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
			this.observerPref.register();
			
			this.renew();
			},
		reload:function()
			{
			this.fileTimer.cancel();
			this.log('Timer is being canceled');
			this.renew();
			},
		renew: function ()
			{
			this.prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			
			//check whether we show debugs or not
			this.boolLog= this.prefManager.getBoolPref("extensions.zoteroautoexporting.showdebug");
			
	
			this.boolActivated = this.prefManager.getBoolPref("extensions.zoteroautoexporting.filedeactivate");
			if(this.boolActivated==false)
				{
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
				
			var temp = this.prefManager.getCharPref("extensions.zoteroautoexporting.filetranslator");
			if(temp.length>4)
				{
				this.log('Filetranslator seems good');
				this.filetranslator=temp;
				}
			else
				{
				this.boolActivated=false;
				this.log('Looks not like a valid filetranslator.. Sorry');
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
				this.fileexportTimer();
				}
			this.log('Renew done');
			},
			
		fileexportTimer: function ()
			{
			this.log('Set the timer for next export in '+this.fileintInterval +' minutes');
			this.fileTimer= Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
			this.fileTimer.initWithCallback(function () { Zotero.AutoExporting.autoexport(); },this.fileintInterval * 60 * 1000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
			}
		,
		autoexport: function ()
			{
			this.log('Run autoexporting to file');
			var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
			file.initWithPath(this.filepath);
			
			this.log('Translator for export inits');
			var expTranslator = new Zotero.Translate('export');
			expTranslator.setLocation(file);
			expTranslator.setTranslator(this.filetranslator);
			this.log('Translatpr for export now run..');
			expTranslator.translate();
			
			var currentTime = new Date();
			this.prefManager.setCharPref("extensions.zoteroautoexporting.filestatus",'Exported  '+currentTime.getDate()+'.'+(currentTime.getMonth() + 1)+'.'+currentTime.getFullYear()+'  '+currentTime.getHours()+':'+currentTime.getMinutes());
			this.fileexportTimer();
			},
		
		log: function (msg) {
		if(this.boolLog==true)
			{
			 var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		   consoleService.logStringMessage('[zoteroautoexporting] '+msg);
		   }
    }
	};
	
	
	}
window.addEventListener("load", function() { Zotero.AutoExporting.init(); }, false);