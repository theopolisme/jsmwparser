/**
 * parser.js
 * pull the templates out of wikicode using javascript
 * aka, the wimpy, 2am, javascript baby brother of mwparserfromhell
 */

/**
 * Parse the templates out of a string of Wikicode
 * @param  {string} string       Initial input string
 * @param  {bool}   brave        Try to parse even if there is a '{{'/''}}'' imbalance
 * @param  {bool}   toplevelonly Only return "top level" matched templates, ignoring nested templates inside them
 * @return {list}                A list of matched templates, as strings
 */
function getTemplates(string,brave,toplevelonly) {
	var copy = string;
	copy = copy.replace(/<\s*nowiki\s*>(.*?(?:<\s*\/\s*nowiki\s*>)|.*$)/g,''); // Remove code inside nowikis; just plaintext
	var chars = copy.split('');
	var openings = [];
	var closings = [];
	$.each(chars, function(index,character) {
		switch (character) {
			case '{':
				if (chars[index+1] == '{') {
					chars[index+1] = undefined;
					openings.push(index);
				}
				break;
			case '}':
				if (chars[index+1] == '}') {
					chars[index+1] = undefined;
					closings.push(index);
				}
		}
	});

	if (!brave && (openings.length != closings.length)) return false;

	var template_positions = [];
	var sol_recur = null;
	var recur_level = 0;

	for (var i = 0; i < openings.length; i++) {
		var start_num = openings[i];
		if (start_num === null) continue;
		var closest = null;
		$.each(closings, function(closeindex,closeitem){
			if ((closest === null || (Math.abs(closeitem - start_num) < Math.abs(closest - start_num))) && closeitem > start_num) {
				var opentemp = openings.slice(i+recur_level+1);
				if (opentemp.length === 0) opentemp = [Infinity];
				if (closeitem < opentemp[0]) {
					closest = closeitem.valueOf();
				} else {
					if (!sol_recur) sol_recur = start_num;
					recur_level++;
				}
			}
		});

		if (closest !== null) {
			var start = (sol_recur ? sol_recur : start_num);
			closings.splice(closings.indexOf(closest)-(toplevelonly ? recur_level : 0),(toplevelonly ? recur_level+1 : 1));
			if (toplevelonly) {
				var end = openings.indexOf(start)+recur_level;
				for (var p = openings.indexOf(start); p <= end; p++) { openings[p] = null; }
			}
			template_positions.push([start,closest]);
			sol_recur = null;
			recur_level = 0;
		}
	}

	var templates = [];
	for (var j = 0; j < template_positions.length; j++) {
		if (template_positions[j][1] === null) {
			template_positions[j][1] = template_positions[j+1][1];
			template_positions.splice(j+1,1);
		}
		templates.push(copy.slice(template_positions[j][0],template_positions[j][1]+2));
	}

	return templates;
}

/**
 * Get the object form of a template
 * @param  {string}          templatecode Raw wikicode of the template, brackets included
 * @param  {bool}            returntitle  Rather than return an object of params, return a list of the title [0] and then the params object [1]
 * @return {object/array}                 What is returned is determined by `returntitle`
 */
function parseTemplate(templatecode,returntitle) {
    var contents = $.trim(templatecode).replace(/(^\{\{|\}\}$)/g,'');
    var pieces = contents.split('|');
    var title = pieces.shift();
    var params = {};
    var increm = 1;
    $.each(pieces, function(index,piece) {
        if (piece.indexOf('=') != -1) {
            var varparts = piece.split(/=/);
            var key = varparts.shift();
            var val = varparts.join('=');
            params[key] = val;
        } else {
            params[increm.toString()] = piece;
            increm++;
        }
    });
    if (returntitle)
        return [title,params];
    else
        return params;
}

function testGetter() {
	var tests = [
		"{{foobaz|{{biz}}}}",
		"{{This is a template|1=yf {{tesdjkhjsl}} }}\nHere we sa{{heaven|head=e {{eggs|ea {{ah}} }} }}uy some more\n\n{{help me|I don\'t get how to use {{tl|cite web}}, since it\'s a confusing template.}}",
		"{{This template is normal|{{hey}}}} but <nowiki>{{this one}} is nowikied!</nowiki>"
	];

	for (var i = 0; i < tests.length; i++) {
		console.log(getTemplates(tests[i], true, true));
		console.log(getTemplates(tests[i], true, false));
	}
}

function testParser() {
	var tests = [
		"{{AFC submission|ts=20130801124623|d|nn|declinets=20130815023926|decliner=Howicus|ts=20130801131437|u=Pippa.lewis|ns=5}}",
		"{{This is a template|1=yf}}",
		"{{This is not a templat|1=jskewhhaa}heaven{}"
	];

	for (var i = 0; i < tests.length; i++) {
		console.log(parseTemplate(tests[i], true));
		console.log(parseTemplate(tests[i], false));
	}
}

testGetter();
testParser();

