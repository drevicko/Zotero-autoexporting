if (typeof ns_zotero_autoexport_toolbar == "undefined") {
	var ns_zotero_autoexport_toolbar = {
		icon_click : function (event) {
			
			this.icon_refresh();
			
			this.menu();
		},
		icon_refresh : function () {
		
			var doc=zotero_autoexport_layout.get_recent_window();
			elem = doc.document.getElementById("zotero-autoexport-status");
			if (elem == null)
				return;
				
			if (typeof(Zotero) == 'undefined') {
				var txt='Zotero Autoexport: Zotero not found';
			} else if (Zotero.AutoExporting.filelast == null || isNaN(Zotero.AutoExporting.filelast)) {
				var txt='Zotero Autoexport: No export known';
			} else {
				var txt='Zotero Autoexport: Last export at ' + Zotero.AutoExporting.format_date(new Date(Zotero.AutoExporting.filelast * 1000));
			}
			
			zotero_autoexport_layout.call_xul_id_if_exists('menu_last_export',function (elem,txt) { elem.setAttribute('label', txt); },txt);
			elem.setAttribute('tooltiptext', txt);
		},
		icon_running : function () {
			zotero_autoexport_layout.call_xul_id_if_exists("zotero-autoexport-status",function (elem) {elem.className += " exportrunning";});
		},
		open_url : function (aUrl) {
		//is twice as in common.js - should be joined in one common class with static calls
		
		var win = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser');
		win.openUILinkIn(aUrl, 'tab');
	},
		icon_stopping : function () {
			zotero_autoexport_layout.call_xul_id_if_exists("zotero-autoexport-status",function (elem) {
				elem.className = elem.className.replace(/(?:^|\s)exportrunning(?!\S)/g, '');
				ns_zotero_autoexport_toolbar.icon_refresh();
				});
		},
		version_to_build_no : function (version) {
			//version like 0.0.2 or 1.1
			var parts = version.split('.');
			var build = 0;
			var max_parts = 3;
			for (var i = 0; i < parts.length; ++i) {
				//check whether it is a numeric
				if (!isNaN(+parts[i]))
					build = build + (Math.pow(10, max_parts - i) * (+parts[i]));
			}
			return build;
		},
		menu : function () {
			//check whether we have valid settings..
			if (Zotero.AutoExporting.boolActivated) {
				Zotero.AutoExporting.autoexport();
				alert('Autoexport done!');
			} else {
				alert('Zotero AutoExport ist not configured or disabled!' + "\n" + 'After setting up the options in the following dialog you can use this button to start the export manually');
				this.prefs_open();

			}
		},

		prefs_open : function () {
			if (null == this._preferencesWindow || this._preferencesWindow.closed) {
				var instantApply = Application.prefs.get("browser.preferences.instantApply");
				var features = "chrome,titlebar,toolbar,centerscreen" + (instantApply.value ? ",dialog=no" : ",modal");

				this._preferencesWindow = window.openDialog("chrome://zoteroautoexporting/content/options.xul", "zotero-autoexporting-window", features);
			}
			this._preferencesWindow.focus();
		},
		init : function () {
			this.icon_refresh();
			
			try {
				Components.utils.import("resource://gre/modules/AddonManager.jsm");
				AddonManager.getAddonByID("zotero-autoexport-bib@rokdd", function (addon) {
					// This is an asynchronous callback function that might not be called immediately

					//now compare with the old version
					var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);

					if (prefManager.getPrefType('extensions.zoteroautoexporting.general-last-version') && prefManager.prefHasUserValue("extensions.zoteroautoexporting.general-last-version")) {
						var old_version = ns_zotero_autoexport_toolbar.version_to_build_no(prefManager.getCharPref("extensions.zoteroautoexporting.general-last-version"));
						//if version is older than 1.0.9 so we update for migration issues the button
						prefManager.setCharPref("extensions.zoteroautoexporting.general-last-version", addon.version);
						if (ns_zotero_autoexport_toolbar.version_to_build_no('1.0.9') > old_version) {
							//Zotero.AutoExporting.log('Detected build no. ' + old_version + ' and is older as 1.0.9: Install button newly');
							Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService).logStringMessage('Detected build no. ' + old_version + ' and is older as 1.0.9: Install button newly');
							ns_zotero_autoexport_toolbar.install_button("addon-bar", "zotero-autoexport-status");
						}

						//Zotero.AutoExporting.log('No action or updates known');


					} else {
						//Zotero.AutoExporting.log('Detected no build no. : Install button newly');
						Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService).logStringMessage('Detected no build no. : Install button newly');
						prefManager.setCharPref("extensions.zoteroautoexporting.general-last-version", addon.version);
						ns_zotero_autoexport_toolbar.install_button("addon-bar", "zotero-autoexport-status");

					}

				});
			} catch (err) {

				Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService).consoleService.logStringMessage('[zoteroautoexporting] ' + err.message);
			}
		
		},
		/**
		 * Installs the toolbar button with the given ID into the given
		 * toolbar, if it is not already present in the document.
		 *
		 * @param {string} toolbarId The ID of the toolbar to install to.
		 * @param {string} id The ID of the button to install.
		 * @param {string} afterId The ID of the element to insert after. @optional
		 */
		install_button : function (toolbarId, id, afterId) {

			// Find the most recently used window

			var mediator = ns_zotero_autoexport_layout.get_recent_window();
			var doc = mediator.document;

			if (!doc.getElementById(id)) {
				var toolbar = doc.getElementById(toolbarId);

				// If no afterId is given, then append the item to the toolbar
				var before = null;
				if (afterId) {
					var elem = document.getElementById(afterId);
					if (elem && elem.parentNode == toolbar)
						before = elem.nextElementSibling;
				}

				toolbar.insertItem(id, before);
				toolbar.setAttribute("currentset", toolbar.currentSet);
				docu.persist(toolbar.id, "currentset");

				if (toolbarId == "addon-bar")
					toolbar.collapsed = false;
			}
		}
	}
	window.addEventListener("load", function () { ns_zotero_autoexport_toolbar.init(); }, false);
	
}
