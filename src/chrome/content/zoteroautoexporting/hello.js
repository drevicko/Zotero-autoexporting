	
if ("undefined" == typeof(Zotero)) {
	if (!("@zotero.org/Zotero;1" in Components.classes))
		{
		EmergencyPrefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		EmergencyPrefManager.setCharPref("extensions.zoteroautoexporting.filestatus",'No Zotero Addon was found. Please download from zotero.org');
		}
	else
		{
		var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(Components.interfaces.nsISupports).wrappedJSObject;
		}
}
if("undefined" != typeof(Zotero) && "undefined" == typeof(Zotero.AutoExporting))
	{
	Zotero.AutoExporting = {
		boolLog: false,
		boolActivated:true,
		prefManager:null,
		active:null,
		fileintInterval: 1,
		filepath:null,
		filetranslator:null,
		observerPref:null,
		fileTimer:null,
		filelast:null,
		filenslfile:null,
		file_keep:false,
		Prefs:{
			},
		init:function()
			{
			//init the pref observer to get a notice when prefs changed and timer can be reseted
			this.log('Setup PrefObserver');
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
			
			this.renew('init addon');
			 if(this.file_keep==true && (new Date().getTime() - this.filelast)>this.fileintInterval)
				{
				this.log('Fired export because last time is longer ago as interval is set');
				this.autoexport ();
				}
			},
		reload:function()
			{
			this.fileTimer.cancel();
			this.log('Timer is being canceled');
			this.renew('reload after timer reset');
			},
		renew: function (reason)
			{
			this.log('Start of renew because of: '+reason);
			this.prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			
			//check whether we show debugs or not
			this.boolLog= this.prefManager.getBoolPref("extensions.zoteroautoexporting.showdebug");
			
			this.boolActivated = !this.prefManager.getBoolPref("extensions.zoteroautoexporting.filedeactivate");
			if(this.boolActivated==false)
				{
				this.log('Autoexporting for files is disabled by user');
				}
			
			//thats the old option!
			var temp = this.prefManager.getCharPref("extensions.zoteroautoexporting.filepath");
			if(temp.length>4)
				{
				this.log('Filepath seems good');
				this.filepath=temp;
				}
			else
				{
				this.log('Looks not like a valid path.. Sorry');
				}
			//now check the new one :)
			if(this.prefManager.getBranch("extensions.zoteroautoexporting.").prefHasUserValue('extensions.zoteroautoexporting.filenslfile'))
				{
				this.filenslfile =this.prefManager.getBranch("extensions.zoteroautoexporting.").getComplexValue("extensions.zoteroautoexporting.filenslfile", Components.interfaces.nsILocalFile);
				}
			if(typeof(this.filenslfile)!='undefined' && this.filenslfile!=null && this.filenslfile.path.length>0)
				{
				this.log('Path of the new file options looks valid');
				}
			else if(this.filepath!=null && this.filepath.length>0)
				{
				//try to migrate from the old path!
				this.filenslfile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
				this.filenslfile.initWithPath(this.filepath);
				this.prefManager.getBranch("extensions.zoteroautoexporting.").setComplexValue("extensions.zoteroautoexporting.filenslfile", Components.interfaces.nsILocalFile, this.filenslfile);
				this.log('Migrated from old path to the new file object');
				}
			else
				{
				this.boolActivated=false;
				this.log('Looks not like a valid path or file!');
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
			
			this.filelast = this.prefManager.getIntPref("extensions.zoteroautoexporting.file-last");
			this.file_keep = this.prefManager.getBoolPref("extensions.zoteroautoexporting.file-bool-keep-interval");
			
			if(this.boolActivated==false)
				{
				this.log('Abort init process and set no timer');
				return false;
				}
			else
				{
				this.fileexportTimer();
				}
			this.log('Renew  done (because of: '+reason+')');
			},
			
		fileexportTimer: function ()
			{
			
			if(this.fileintInterval > 2)
				{
				this.fileTimer= Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
				this.fileTimer.initWithCallback(function () { Zotero.AutoExporting.autoexport(); },this.fileintInterval * 60 * 1000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
				this.log('Set the timer for next export in '+this.fileintInterval +' minutes');
				}
			else
				{
				this.log('Interval is not correct or too less!');
				}
			}
		,
		autoexport: function ()
			{
			this.log('Run autoexporting to file');
			//var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
			//file.initWithPath(this.filepath);

			//var this.filenslfile =this.prefManager.getComplexValue("extensions.zoteroautoexporting.filenslfile", Components.interfaces.nsILocalFile);
			if(this.filenslfile.path.length>0)
				{
				this.log('Fileobject is writeable')
				this.log('Translator for export inits');
				var expTranslator = new Zotero.Translate('export');
				expTranslator.setLocation(this.filenslfile);
				expTranslator.setTranslator(this.filetranslator);
				this.log('Translator for export now run..');
				expTranslator.translate();
				
				var currentTime = new Date();
				this.log('Exported  '+currentTime.getDate()+'.'+(currentTime.getMonth() + 1)+'.'+currentTime.getFullYear()+'  '+currentTime.getHours()+':'+(( currentTime.getMinutes() < 10 ? "0" : "" ) + currentTime.getMinutes()),true);
				this.prefManager.setIntPref("extensions.zoteroautoexporting.file-last",currentTime.getTime());
				}
			else
				{
				this.log('Fileobject is not specified or not writeable');
				}
			this.fileexportTimer();
			},
		
		log: function (msg, boolPanel) {
			if(boolPanel==true)
				{
				this.prefManager.setCharPref("extensions.zoteroautoexporting.filestatus",msg);
				}
			if(this.boolLog==true)
				{
				 var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
			   consoleService.logStringMessage('[zoteroautoexporting] '+msg);
			   }
			}
	};
	}
window.addEventListener("load", function() { Zotero.AutoExporting.init(); }, false);