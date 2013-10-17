/**
 * Resource Drive Converter
 * Created by Luke Askew [laskew@resource.com]
 */

"use strict";

(function(ZeroClipboard) {

	/**
	 * @namespace
	 */
	var converter = window.converter = {};


	/**
	 * Converted paths
	 * @type {Object}
	 */
	converter.paths = {
		windows: null,
		mac: null
	};


	/**
	 * Cached DOM
	 * @type {Object}
	 */
	converter.cache = {
		container: document.querySelector(".container"),
		source: document.getElementById("source"),
		output: {
			windows: document.getElementById("windows"),
			mac: document.getElementById("mac"),
			both: document.getElementById("both")
		},
		clipboards: {
			windows: document.getElementById("clipboard-windows"),
			mac: document.getElementById("clipboard-mac"),
			both: document.getElementById("clipboard-both")
		}
	};


	/**
	 * ZeroClipboard instantiation
	 * @type {Object}
	 */
	converter.clipboard = new ZeroClipboard(document.querySelectorAll(".copy-button"), {
		moviePath: "assets/swf/ZeroClipboard.swf"
	});


	/**
	 * Converts a Mac path to Windows
	 * @function
	 * @param  {String} path Mac-formatted path
	 * @return {String} Windows-formatted path
	 */
	converter.macToWindows = function(path) {

		// TODO conversion logic
		var windowsDrive;

		// determine the windows drive mapping
		if (path.match(/clients\$/)) {
			windowsDrive = "P";
		} else if (path.match(/shared\$/)) {
			windowsDrive = "S";
		} else {
			windowsDrive = "?";
		}

		path = path.replace(/\//g, "\\");

		// output in /Volumes/ format
		if (path.match(/smb:\\\\/)) {
			path = path.replace(/smb:\\\\colarnfs\d+\\[\w]+\$/, windowsDrive + ":");
		} else if (path.match(/\\Volumes\\/)) {
			path = path.replace(/\\Volumes/, windowsDrive + ":");
		}

		this.paths.windows = path;

		return this;

	};

	converter.macToMac = function(path) {

		// determine the windows drive mapping
		if (path.match(/smb:\/\//)) {
			path = path.replace(/smb:\/\/colarnfs\d+/, "/Volumes");
		}

		this.paths.mac = path;

		return this;

	};


	/**
	 * Converts a Windows path to Mac
	 * @function
	 * @param  {String} path Windows-formatted path
	 * @return {String} Mac-formatted path
	 */
	converter.windowsToMac = function(path) {

		var macDrive,
			windowsDrive = path.slice(0, 1);

		// determine drive mapping
		if (windowsDrive === "P") {
			macDrive = "clients$";
		} else if (windowsDrive === "S") {
			macDrive = "shared";
		}

		path = path.replace(/\\/g, "/");
		path = path.replace(/[P,S,H]:/, "/Volumes/" + macDrive);

		this.paths.mac = path;

		return this;

	};


	/**
	 * Conversion hub
	 * @param  {String} path
	 */
	converter.convert = function(path) {

		// get conversion type
		var conversionType = this.determineConversionType(path);

		// convert
		this[conversionType](path);

		// explicitly set output value for value that isn't converted
		if (conversionType === "windowsToMac") {
			this.paths.windows = path;
		}

		if (conversionType === "macToWindows") {
			// convert the mac path because it can be /Volumes/ or smb://
			this.macToMac(path);
		}

		// update output paths
		this.updateOutput();

		return this;

	};

	/**
	 * Determine the type of conversion needed
	 * @param  {String} path
	 * @return {String} Conversion type
	 */
	converter.determineConversionType = function(path) {

		if (path.match(/\/Volumes\/|smb:\/\//)) {
			return "macToWindows";
		} else if (path.match(/[P,S,H]:\\/)) {
			return "windowsToMac";
		}

	};


	/**
	 * Sets values of output input elements to the converted values
	 * @return {[type]} [description]
	 */
	converter.updateOutput = function() {

		// combine paths in a nice format (thinking about emails)
		var combined = "Windows path:\n" + this.paths.windows + "\nMac path:\n" + this.paths.mac;

		// set element values
		this.cache.output.mac.value = this.paths.mac;
		this.cache.output.windows.value = this.paths.windows;
		this.cache.output.both.value = combined;

		// set clipboard values
		this.cache.clipboards.mac.setAttribute("data-clipboard-text", this.paths.mac);
		this.cache.clipboards.windows.setAttribute("data-clipboard-text", this.paths.windows);
		this.cache.clipboards.both.setAttribute("data-clipboard-text", combined);

		return this;

	};


	/**
	 * Validates that a given path is valid Windows or Mac path
	 * @param  {String} path
	 * @return {Boolean}
	 */
	converter.validate = function(path) {
		// http://regex101.com/r/fN2cV5
		return path.match(/\/Volumes\/\w+\$|smb:\/\/|[P,S,H]:\\/);
	};


	/**
	 * Binds conversion handler to source input
	 */
	converter.bind = function() {

		// bind keyup to #source
		this.cache.source.addEventListener("keyup", function(e) {

			// get source input
			var path = e.target.value;

			// if valid, convert
			if (converter.validate(path)) {
				converter.convert(path);
				converter.cache.container.setAttribute("data-valid", "valid");
			} else if (path.length === 0) {
				converter.cache.container.removeAttribute("data-valid");
			} else {
				converter.cache.container.setAttribute("data-valid", "invalid");
			}

		});

		this.cache.source.focus();

	};

	converter.bind();

}(window.ZeroClipboard));