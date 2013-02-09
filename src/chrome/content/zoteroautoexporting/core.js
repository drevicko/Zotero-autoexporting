	
if ("undefined" == typeof(Zotero)) {
	if (!("@zotero.org/Zotero;1" in Components.classes))
		{
		var currentTime = new Date();
				
		EmergencyPrefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		EmergencyPrefManager.setCharPref("extensions.zoteroautoexporting.filestatus",'{"'+((currentTime.getDate() < 10 ? "0" : "" ) + currentTime.getDate())+'.'+(currentTime.getMonth() + 1)+'.'+currentTime.getFullYear()+'  '+(( currentTime.getHours() < 10 ? "0" : "" ) + currentTime.getHours())+':'+(( currentTime.getMinutes() < 10 ? "0" : "" ) + currentTime.getMinutes())+':'+currentTime.getSeconds()+':'+currentTime.getMilliseconds()+'":"No Zotero Addon was found. Please download from zotero.org"}');
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
		boolLogAlltoPanel:false,
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
		file_collections_map:false,
		Prefs:{
			},
		init:function()
			{
			this.prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			//check for  migrating to the new log format of version 1.0
			
			//for update purposes we look whether it might a json
				if(this.prefManager.getCharPref("extensions.zoteroautoexporting.filestatus").indexOf('{')>-1)
				{
				//we have to truncate if the array is long 
				this.log_truncate();
				}
				else
				{
				this.prefManager.clearUserPref("extensions.zoteroautoexporting.filestatus");
				}
				
			//from here is now regular
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
					if(aTopic == "nsPref:changed" && aData!='file-last' && aData!='filestatus' )
					{
					Zotero.AutoExporting.log('sub'+aSubject);
					Zotero.AutoExporting.log('data'+aData);
					Zotero.AutoExporting.reload();
					}
				  }
				}
			this.observerPref.register();
			
			this.renew('init addon');
			
			},
		reload:function()
			{
			this.fileTimer.cancel();
			this.log('Timer is being canceled');
			this.renew('reload after timer reset');
			},
		renew: function (reason)
			{
			this.log('Renew because of:  '+reason);
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
			if(this.prefManager.prefHasUserValue('extensions.zoteroautoexporting.filepath') && temp.length>4)
				{
				this.log('Old Filepath seems good');
				this.filepath=temp;
				}
			else
				{
				this.log('Looks not like a valid old path.. Sorry');
				}
			//now check the new one :)
			if(this.prefManager.prefHasUserValue('extensions.zoteroautoexporting.filenslfile'))
				this.filenslfile =this.prefManager.getComplexValue("extensions.zoteroautoexporting.filenslfile", Components.interfaces.nsILocalFile);
			else
				this.filenslfile=null;
			if(typeof(this.filenslfile)!='undefined' && this.filenslfile!=null && this.filenslfile.path.length>0)
				{
				this.log('Path of the new file options looks valid: '+this.filenslfile.path);
				}
			else if(this.filepath!=null && this.filepath.length>0)
				{
				//try to migrate from the old path!
				this.filenslfile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
				this.filenslfile.initWithPath(this.filepath);
				this.prefManager.setComplexValue("extensions.zoteroautoexporting.filenslfile", Components.interfaces.nsILocalFile, this.filenslfile);
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
			this.file_collections_map = this.prefManager.getBoolPref("extensions.zoteroautoexporting.file-bool-collections-map");
			
			if(this.boolActivated==false)
				{
				this.log('Abort init process and set no timer');
				return false;
				}
			else if(this.file_keep==true && ((Math.round(new Date().getTime() /1000)- (this.filelast))>this.fileintInterval*60))
				{
				this.log('Fired export because last time is longer ago as interval is set:: '+this.fileintInterval+'--'+(Math.round(new Date().getTime()/1000) - (this.filelast*60))+'.'+ this.filelast*60+'++'+Math.round(new Date().getTime()/1000));
				this.autoexport ();
				}
			else
				{
				this.fileexportTimer();
				}
			this.log('Renew  done: '+reason);
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
		item_rewrite_key:function(obj,item)
		{
		
		this.log('Item Done Handler has started'+item.id);
		},
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
				//expTranslator.setHandler("translators", function (obj, item) 	{ Zotero.AutoExporting.item_rewrite_key(obj,item); }); 
				expTranslator.setLocation(this.filenslfile);
				expTranslator.setTranslator(this.filetranslator);
				this.log('Translator for export now run..');
				
				expTranslator.translate();
				
				//export the collections too
				if(this.file_collections_map)
					{
					this.log('Export the collections');
					var collections = Zotero.getCollections(null);
					for (c in collections)
						{
						this.log('Exported collection ' + collections[c].name+'('+collections[c].id+')');
						expTranslator.setCollection(collections[c]);
						var tempFile=this.filenslfile.clone();
						//setup the new filenames from collection name
						tempFile.leafName=collections[c].name+((/[.]/.exec(this.filenslfile.leafName)) ? '.'+/[^.]+$/.exec(this.filenslfile.leafName) : '');
						expTranslator.setLocation(tempFile);
						
						//now translate 
						expTranslator.translate();
						}
					var strTextAdd='(+collections) ';
					}
				else
					var strTextAdd='';
				
				//POSTPROCESS now
				if(this.prefManager.getBoolPref('extensions.zoteroautoexporting.postprocessbool',false)==false)
				{
					if(this.prefManager.prefHasUserValue('extensions.zoteroautoexporting.postprocessfile'))
				{
				var cmdFile=this.prefManager.getComplexValue("extensions.zoteroautoexporting.postprocessfile", Components.interfaces.nsILocalFile);
					if(cmdFile.exists())
					{
					var cmdProcess = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);  
					cmdProcess.init(cmdFile);
					  
					var args = ["ar", "test"];
					cmdProcess.run(false, args, args.length); 
					strTextAdd+=' and runned postprocess';
					}
					else
					{
					this.log('Postprocessfile was not found and could not be used');
					strTextAdd+=' and NOT runned postprocess';
					}
					}
					}
				var currentTime = new Date();
				
				this.log('Exported '+strTextAdd+' '+(( currentTime.getDate() < 10 ? "0" : "" ) + currentTime.getDate())+'.'+(currentTime.getMonth() + 1)+'.'+currentTime.getFullYear()+'  '+(( currentTime.getHours() < 10 ? "0" : "" ) + currentTime.getHours())+':'+(( currentTime.getMinutes() < 10 ? "0" : "" ) + currentTime.getMinutes()),true);
				this.prefManager.setIntPref("extensions.zoteroautoexporting.file-last",Math.round(currentTime.getTime()/1000));
				this.filelast=Math.round(currentTime.getTime()/1000);
				}
			else
				{
				this.log('Fileobject is not specified or not writeable');
				}
			this.fileexportTimer();
			},
		
		log: function (msg, boolPanel) {
			if(boolPanel==true || this.boolLogAlltoPanel==true)
				{
				var json_log=JSON.parse(this.prefManager.getCharPref("extensions.zoteroautoexporting.filestatus",'{}'));
				var currentTime = new Date();
				if(json_log.hasOwnProperty((( currentTime.getDate() < 10 ? "0" : "" ) + currentTime.getDate())+'.'+(currentTime.getMonth() + 1)+'.'+currentTime.getFullYear()+'  '+(( currentTime.getHours() < 10 ? "0" : "" ) + currentTime.getHours())+':'+(( currentTime.getMinutes() < 10 ? "0" : "" ) + currentTime.getMinutes())+':'+currentTime.getSeconds()+':'+currentTime.getMilliseconds()))
				json_log[(( currentTime.getDate() < 10 ? "0" : "" ) + currentTime.getDate())+'.'+(currentTime.getMonth() + 1)+'.'+currentTime.getFullYear()+'  '+(( currentTime.getHours() < 10 ? "0" : "" ) + currentTime.getHours())+':'+(( currentTime.getMinutes() < 10 ? "0" : "" ) + currentTime.getMinutes())+':'+currentTime.getSeconds()+':'+currentTime.getMilliseconds()+msg.length]=msg;
				else
				json_log[(( currentTime.getDate() < 10 ? "0" : "" ) + currentTime.getDate())+'.'+(currentTime.getMonth() + 1)+'.'+currentTime.getFullYear()+'  '+(( currentTime.getHours() < 10 ? "0" : "" ) + currentTime.getHours())+':'+(( currentTime.getMinutes() < 10 ? "0" : "" ) + currentTime.getMinutes())+':'+currentTime.getSeconds()+':'+currentTime.getMilliseconds()]=msg;
				this.prefManager.setCharPref("extensions.zoteroautoexporting.filestatus",JSON.stringify(json_log));
				}
			if(this.boolLog==true)
				{
				 var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
			   consoleService.logStringMessage('[zoteroautoexporting] '+msg);
			   }
			},
		log_truncate:function()
		{
		var json_log=JSON.parse(this.prefManager.getCharPref("extensions.zoteroautoexporting.filestatus",'{}'));
		if(Object.keys(json_log).length>16)
		{
		for(var prop in json_log) {
    if(json_log.hasOwnProperty(prop))
        {
        delete json_log[prop];
        }
        if(Object.keys(json_log).length<10)
        break;
}

		
		this.prefManager.setCharPref("extensions.zoteroautoexporting.filestatus",JSON.stringify(json_log));
		}
		
		}
	};
	window.addEventListener("load", function() { Zotero.AutoExporting.init(); }, false);
	}
