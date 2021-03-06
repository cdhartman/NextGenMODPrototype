/*jslint browser: true*/
/*global $, jQuery, alert, console, document, parseAndDisplaypatEdCategories, getCookie, createNextScreenButton, formatCategoryName, handleAjaxError */

function getPatientEdCategories(fileURL, nodeId, start, numberOfColumns, numberOfRows, targetRegion, targetDiv, view, titleLength, site, screenFormat) {
	"use strict";
	var dataType = 'xml', node;

	$.ajax({
		type: "GET",
		url: fileURL,
		cache: true,
		dataType: dataType,
		success: function (xml) {
			// get the requested catalogue node and call function for processing
			node = $(xml).contents().find('category[id=\"' + nodeId + '\"]').children();
			parseAndDisplaypatEdCategories(node, fileURL, start, numberOfColumns, numberOfRows, targetRegion, targetDiv, view, titleLength, site, screenFormat);
		},
		error: function (jqXHR, statusText, errorThrown) {
			handleAjaxError(jqXHR, statusText, errorThrown, 'getPatientEdCategories');
		}
	});

}

function parseAndDisplaypatEdCategories(node, fileURL, start, numberOfColumns, numberOfRows, targetRegion, targetDiv, view, titleLength, site, screenFormat) {
	"use strict";
	var divContent = '', screenCount = 0, categoriesPerScreen = numberOfColumns * numberOfRows, count = 0, lineNumber = 0, columnNumber = 1,
		skippedCount = 0, composeURL = '', categoryName = '', urlCategoryName = '', nextStart = parseInt(start, 10) + categoriesPerScreen, nextURL = '', currentScreen,
		nodeLength = $(node).length, startTemp = start, i, nextStartTemp, chaserContent = '', chaserLeftNumber = 0, chaserRightNumber = 0, videosInCategory = 0,
		prefenencesExist = true, prefenenceFlag = false, navigationLegend = '', endCount = 0, prefenenceCount = 0, excludeCategoryArray = '';

	currentScreen = Math.round((start / categoriesPerScreen) + 1);

	// 18 - Surgery Pediatric (not in Florida)
	// 54 - Pregnancy-Newborn (not in Florida)
	// 455 - Psychiatry and Psychology (not in Florida)
	// 2356 - Arizona (only)
	// 3127 - Jacksonville (only)
	// 3731 - High Definition (not in Arizona, Rochester)
	// 30164 - Keep Pace

	if (fileURL.indexOf("993") === -1) {
		if (site === 'RO') {
			excludeCategoryArray = ['2356', '3127', '3731', '30164', '35575'];
		} else if (site === 'AZ') {
			excludeCategoryArray = ['3127', '30164', '35575'];
		} else if (site === 'FL') {
			excludeCategoryArray = ['18', '54', '455', '2356', '3127', '30164', '35575'];
		}
	}

	$(node).each(function (i,  row) {
		if ($(this).attr('name') !== undefined && $(this).attr('bottomCategories') !== 'true' && $.inArray($(this).attr('id'), excludeCategoryArray) === -1) {

			if (i >= (startTemp) && count < categoriesPerScreen) {
				categoryName = $(this).attr('name');
				if (prefenencesExist && getCookie('pePreferences').indexOf(categoryName) !== -1 && view === 'Adult') {
					prefenenceFlag = true;
					prefenenceCount++;
				} else {
					prefenenceFlag = false;
				}
				count++;
				lineNumber++;
				categoryName = formatCategoryName(categoryName, 28);
				urlCategoryName = categoryName.replace(' & ', ' %26 ');

				composeURL = 'javascript:ForwardWithIDAndQuery(';
				// alert($(this).attr('hasCategories'));
				if ($(this).attr('hasCategories') === 'true') {
					composeURL += '\'patientEdSubCat.html';
					videosInCategory = $(this).children().children().length - $(this).children().length + 1;
				} else {
					composeURL += '\'patientEdGenre.html';
					videosInCategory = $(this).children().length - 1;
				}
				if (fileURL.indexOf("993") !== -1) {
					composeURL += '?genre=' + 'Frequently%20Viewed' + '&amp;genreID=' + $(this).attr('id');
					composeURL += '&amp;subGenre=' + encodeURI($(this).attr('name')) + '&amp;subGenreID=' + $(this).attr('id');
					composeURL += '&amp;quickPlay=1&amp;view=' + view;
				} else {
					composeURL += '?genre=' + encodeURI($(this).attr('name')) + '&amp;genreID=' + $(this).attr('id') + '&amp;view=' + view;
				}
				composeURL += '\');';

				// For ICTV, create chaser (arrow key) short-cuts
				chaserContent = '';
				if (columnNumber === 1) { chaserLeftNumber = ((numberOfColumns - 1) * numberOfRows) + count; chaserContent = ' chaser_left=\"link' + chaserLeftNumber + '\"'; }
				if (columnNumber === numberOfColumns) { chaserRightNumber = count - ((numberOfColumns - 1) * numberOfRows); chaserContent = "chaser_right=\"link" + chaserRightNumber + "\""; }

				// build category URL
				divContent += '<div class=\"lineColumn' + targetRegion + ' lineColumn' + targetRegion + columnNumber + ' linePatEd';
				if (fileURL.indexOf("993") !== -1) {
					divContent += 'FV';
				}
				divContent += lineNumber;
				if (prefenenceFlag) { divContent += ' preferredCategory'; }
				divContent += '\" >';
				divContent += '<a id=\"link' + count + '\" href=\"' + composeURL + '\" class=\"lineItems' + targetRegion + '\" tabIndex=\"' + count + '\"' + chaserContent + '>';
				divContent += categoryName;
				divContent += '</a>';
				// if (prefenenceFlag) { divContent += '<img src=\"../images/icons/star_blue.gif\" />'; }
				divContent += '<span class=videoCount>(' + videosInCategory + ')</span>';
				divContent += '</div>\n';

				if (fileURL.indexOf("993") !== -1 && screenFormat === 'HD' && $(this).attr('hasCategories') === 'true') {
					// if freq viewed (a.k.a. channel 993), expand sub categories
					$(this).children().each(function (i,  row) {
						if ($(this).attr('name') !== undefined) {
							// alert($(this).attr('id') + ' | ' + $(this).attr('name')  + ' | ' + $(this).text());
							count++;
							if (lineNumber >= numberOfRows) { lineNumber = 0; columnNumber++; }
							lineNumber++;

							composeURL = 'javascript:ForwardWithIDAndQuery(';
							composeURL += '\'patientEdGenre.html';
							composeURL += '?genre=' + encodeURIComponent(urlCategoryName) + '&genreID=90000';
							composeURL += '&amp;subGenre=' + encodeURIComponent($(this).attr('name')) + '&amp;subGenreID=' + $(this).attr('id');
							composeURL += '&amp;quickPlay=1';
							composeURL += '&amp;view=' + view;
							composeURL += '\');';
							divContent += '<div class=\"lineColumn lineColumnIndent lineColumn' + columnNumber + ' lineCategories' + targetRegion + lineNumber + '\" id=\"lineColumn' + lineNumber + '\" onclick=\"' + composeURL + '\" >';
							divContent += ' <img src=\"../images/icons/navbar/li.gif\" /> <a id=\"Button' + lineNumber + '\" href=\"' + composeURL + '\" class=\"lineItems\" tabIndex=\"' + count + '\">';
							divContent += $(this).attr('name');
							divContent += '</a></div>\n';
						}
					});
				}

				if (lineNumber >= numberOfRows) {
					// if column is full, move to next column
					lineNumber = 0;
					columnNumber++;
				}
				if (count === categoriesPerScreen) {
					// if no more categories can be displayed, stop processing
					return false;
				}

			}
		} else {
			skippedCount++;
			if ($(this).attr('name') !== undefined) { startTemp++; }
		}
	});

	screenCount = Math.round(parseFloat(((nodeLength - skippedCount) / categoriesPerScreen)) + 0.49);

	if (screenCount > 1 && currentScreen !== screenCount) {
		// if more than one screen of categories exist, display navigation elements
		nextStartTemp = nextStart;
		nextURL = 'javascript:ForwardWithID(\'index.html?start=' + nextStartTemp + '&view=' + view + '\');';
		setTimeout(function () { createNextScreenButton(nextURL, screenFormat); }, 500);

		divContent += '<div class=\"screenBulletIndicatorPE\">';
		for (i = 1; i < screenCount + 1; i++) {
			if (i === currentScreen) {
				divContent += '<img src=\"../images/icons/bullets/bullet-selected.gif\" /> ';
			} else {
				divContent += '<img src=\"../images/icons/bullets/bullet.gif\" /> ';
			}
			divContent += ' &nbsp;&nbsp; ';
		}
		divContent += '</div>';
	} else {
		// since there is only one screen of categories, remove 'Next' button
		setTimeout(function () { $('#navbarNext').html(''); }, 500);
	}
	if (fileURL.indexOf("993") === -1) {
		endCount = count + parseInt(start, 10) - 1;
		navigationLegend = start + '-' + endCount + ' of ';
		navigationLegend += nodeLength - skippedCount + ' categories';
		$('#itemCount').html(navigationLegend);
	}
	$('#' + targetDiv).append(divContent);
	$('#ajaxLoader').html('');

}