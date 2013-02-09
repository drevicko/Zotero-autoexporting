
var pref_handler={
cache: {},
prefs_complex_list: {'filenslfile':'filepathvirtual','postprocessfile':'postprocesspathvirtual'},
prefs_string_list:{'filestatus':'filestatus','filepath':'filepath','filenslfile':'filenslfile','filetranslator':'filetranslator'},
prefs_int_list:{'fileinterval':'fileinterval','file-last':'file-last'},
prefs_bool_list:{'postprocess-bool':'postprocessbool','showdebug':'showdebug','filedeactivate':'filedeactivate','file-bool-collection-map':'file-bool-collections-map','file-bool-keep-interval':'file-bool-keep-interval'},
loadPrefs:function()
{
/*this.prefs_complex_list=Array();
this.prefs_int_list=Array();
this.prefs_int_list['fileinterval']='fileinterval';
this.prefs_int_list['file-last']='file-last';*/
this.prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
//.getBranch("extensions.zoteroautoexporting.");
if ("undefined" == typeof(Zotero)) {
	if (!("@zotero.org/Zotero;1" in Components.classes))
		{
		//alert('Zotero konnte nicht gefunden werden-');
		}
	else
		{
		var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(Components.interfaces.nsISupports).wrappedJSObject;
		}
	}
	
	//now setups the prefs into this class
	for(var pref_id in this.prefs_int_list)
	if(document.getElementById('zotero-autoexporting-'+pref_id)!=null)
		document.getElementById('zotero-autoexporting-'+pref_id).value=this.prefManager.getIntPref("extensions.zoteroautoexporting."+this.prefs_int_list[pref_id]);
	
	for(var pref_id in this.prefs_bool_list)
	if(document.getElementById('zotero-autoexporting-'+pref_id)!=null)
		document.getElementById('zotero-autoexporting-'+pref_id).checked=this.prefManager.getBoolPref("extensions.zoteroautoexporting."+this.prefs_bool_list[pref_id]);
		
	for(var pref_id in this.prefs_string_list)
		if(document.getElementById('zotero-autoexporting-'+pref_id)!=null)
			document.getElementById('zotero-autoexporting-'+pref_id).value=this.prefManager.getCharPref("extensions.zoteroautoexporting."+this.prefs_string_list[pref_id]);
	
	for(var pref_id in this.prefs_complex_list)
		this.init_file('extensions.zoteroautoexporting.'+pref_id,'zoteroautoexporting.'+this.prefs_complex_list[pref_id]);
		
	//load the box with latest logs
	this.init_status();
	
	//arrange the menu with zotero translators
	var selectedTranslator= this.prefManager.getCharPref("extensions.zoteroautoexporting.filetranslator");
	
	if ("undefined" != typeof(Zotero)) {
	var translators = Zotero.Translators.getAllForType('export');
	translators.sort(function(a, b) { return a.label.localeCompare(b.label) });
	var formatPopup = document.getElementById("format-popup");
	// add styles to format popup
	for(var i in translators) {
		var itemNode = document.createElement("menuitem");
		itemNode.setAttribute("label", translators[i].label);
		itemNode.setAttribute("value", translators[i].translatorID);
		formatPopup.appendChild(itemNode);
		
		if(translators[i].translatorID == selectedTranslator) {
			document.getElementById("format-menu").selectedIndex = i;
		}
	}
	}

}
,
onAccept:function()
{
	//now save all values
	for(var pref_id in this.prefs_int_list)
	if(document.getElementById('zotero-autoexporting-'+pref_id)!=null)
		this.prefManager.setIntPref("extensions.zoteroautoexporting."+this.prefs_int_list[pref_id],document.getElementById('zotero-autoexporting-'+pref_id).value);
	
	for(var pref_id in this.prefs_bool_list)
	if(document.getElementById('zotero-autoexporting-'+pref_id)!=null)
		this.prefManager.setBoolPref("extensions.zoteroautoexporting."+this.prefs_bool_list[pref_id],document.getElementById('zotero-autoexporting-'+pref_id).checked);
		
	for(var pref_id in this.prefs_string_list)
		if(document.getElementById('zotero-autoexporting-'+pref_id)!=null)
			this.prefManager.setCharPref("extensions.zoteroautoexporting."+this.prefs_string_list[pref_id],document.getElementById('zotero-autoexporting-'+pref_id).value);
	
	for(var pref_id in this.prefs_complex_list)
		if(this.cache['pref_'+'extensions.zoteroautoexporting.'+pref_id]!=null)
			this.prefManager.setComplexValue('extensions.zoteroautoexporting.'+pref_id, Components.interfaces.nsILocalFile, this.cache['pref_'+'extensions.zoteroautoexporting.'+pref_id]);
		else
			this.prefManager.clearUserPref('extensions.zoteroautoexporting.'+pref_id);
			
	//save the choosen translator
	this.prefManager.setCharPref("extensions.zoteroautoexporting.filetranslator",document.getElementById("format-menu").selectedItem.value);
	
}
,onCancel:function()
{
},
open_url: function(aUrl)
	{
	window.opener.openURL(aUrl);
	}
,
test_export:function ()
{
	if ("undefined" == typeof(Zotero)) {
		var Zotero = Components.classes["@zotero.org/Zotero;1"].getService(Components.interfaces.nsISupports).wrappedJSObject;
	}
	if ("undefined" == typeof(Zotero)) {
	alert('Zotero could not be found and the test does not run');
	}
	else
	{
	//apply the latest settings
	this.onAccept();
	
	alert('Now the settings are saved and we just run..');
	//set that we are log all
	Zotero.AutoExporting.boolLogAlltoPanel=true;
	Zotero.AutoExporting.log('----- Test run-------');
	if(Zotero.AutoExporting.renew('Manually run and prefs might be changed')!=false)
		Zotero.AutoExporting.autoexport();
	
	Zotero.AutoExporting.boolLogAlltoPanel=false;
	this.init_status();
	alert('The tests ends');
	}
}
,
select_file:function (prefid,prefbox,mode)
	{
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
//	var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.zoteroautoexporting.");
	if(mode=='select')
	{
	fp.init(window, "Browse file", nsIFilePicker.modeOpen);
	}
	else
	{
	fp.init(window, "Export file", nsIFilePicker.modeSave);
	}
	fp.appendFilters(nsIFilePicker.filterText | nsIFilePicker.filterAll);
	
	//set the default path from current file in the cache
	if(this.cache['pref_'+prefid]!=null)
		fp.displayDirectory=this.cache['pref_'+prefid].parent;
			
	var res = fp.show();
	if (res == nsIFilePicker.returnOK || res == nsIFilePicker.returnReplace)
		{	
		//update the textbox on prefs page
		document.getElementById(prefbox).value=fp.file.path;
		//update the cache
		this.cache['pref_'+prefid]=fp.file;
		}
	},
reset_file:function (prefid,prefbox)
	{
		document.getElementById(prefbox).value='not set yet';
		//update the cache
		this.cache['pref_'+prefid]=null;
	},
init_file:function (prefid,prefbox)
	{
	
	if(this.prefManager.prefHasUserValue(prefid))
	{ 
	var temp=this.prefManager.getComplexValue(prefid, Components.interfaces.nsILocalFile);
	if(temp.path.length>0)
	{
		document.getElementById(prefbox).value=temp.path;
		this.cache['pref_'+prefid]=temp;
		return true;
		}
	}
	//etablish cache if the file is selected new;
	this.cache['pref_'+prefid]=null;
	document.getElementById(prefbox).value='not set yet';
	}
	,
init_status: function ()
	{
	//set the logbox
	var logboxtext='';

	var json_log=JSON.parse(this.prefManager.getCharPref("extensions.zoteroautoexporting.filestatus",'{}'));
	
	var sort_keys = new Array();
	var sort_obj = {};

	for (var i in json_log){
		sort_keys.push(i);
	}
	sort_keys.sort(function(a,b){return b-a});
	for (var k in sort_keys){
		sort_obj[sort_keys[k]] = json_log[sort_keys[k]];
	}
	for (var i_log in sort_obj)
		logboxtext+=i_log+':   '+sort_obj[i_log]+"\n";
	document.getElementById('zoteroautoexporting.filestatus').value=logboxtext;
	}
};
