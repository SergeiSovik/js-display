/*
 * Copyright 2000-2020 Sergei Sovik <sergeisovik@yahoo.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

import { MessagePool } from "./../../js-message/globals/message.js"
import { bindEvent } from "./../../../include/event.js"

// Visibility Detection

const oVisibilityEventMap = {
	'focus': true,
	'focusin': true,
	'pageshow': true,
	'blur': false,
	'focusout': false,
	'pagehide': false
};

export const evShow = 'evShow';
export const evHide = 'evHide';

let sHiddenFunction = 'hidden';

/**
 * @this {*}
 * @param {Event | {type: string}} oEvent 
 */
function onVisibilityChange(oEvent) {
	oEvent = oEvent || window.event;
	/** @type {boolean} */ let bVisible;
	if (oEvent.type in oVisibilityEventMap)
		bVisible = oVisibilityEventMap[oEvent.type];
	else
		bVisible = this[sHiddenFunction] ? false : true;
	
	if (bVisible)
		MessagePool.post(evShow);
	else
		MessagePool.post(evHide);
}

// Modern Browsers
if (platform.document === undefined)
	onVisibilityChange.call(platform, {'type': 'focus'});
else if (sHiddenFunction in platform.document)
	platform.document.addEventListener('visibilitychange', onVisibilityChange);
else if ((sHiddenFunction = 'mozHidden') in document)
	platform.document.addEventListener('mozvisibilitychange', onVisibilityChange);
else if ((sHiddenFunction = 'webkitHidden') in document)
	platform.document.addEventListener('webkitvisibilitychange', onVisibilityChange);
else if ((sHiddenFunction = 'msHidden') in document)
	platform.document.addEventListener('msvisibilitychange', onVisibilityChange);
// IE <= 9:
else if ('onfocusin' in document)
	platform.document.onfocusin = platform.document.onfocusout = onVisibilityChange;
// Other Browsers:
else
	platform.onpageshow = platform.onpagehide = platform.onfocus = platform.onblur = onVisibilityChange;

// Detect initial state
if (platform.document !== undefined) {
	if (platform.document[sHiddenFunction] !== undefined)
		onVisibilityChange.call(platform.document, {'type': platform.document[sHiddenFunction] ? 'blur' : 'focus'});
	else
		onVisibilityChange.call(platform, {'type': 'focus'});
}

/**
 * Display Inch size in pixels
 * 
 * fX - width / fY - height / fXh - half width / fYh - half height
 * 
 * @type {{fX: number, fY: number, fXh: number, fYh: number}}
 */
export var inch = {fX: 100, fY: 100, fXh: 50, fYh: 50};

/** @type {number} */ 
export var density = detectScreen();

function calculateInch() {
	if (platform.document === undefined) {
		inch.fX = inch.fY = 96;
	} else {
		let domDiv = platform.document.createElement("div");
		domDiv.style.position = "fixed";
		domDiv.style.left = "0px";
		domDiv.style.top = "0px";
		domDiv.style.width = "1in";
		domDiv.style.height = "1in";
		domDiv.style.overflow = "hidden";
		domDiv.style.visibility = "hidden";
		platform.document.body.appendChild(domDiv);
		
		inch.fX = domDiv.clientWidth;
		inch.fY = domDiv.clientHeight;
	
		platform.document.body.removeChild(domDiv);
	}
	
    inch.fXh = inch.fX / 2;
	inch.fYh = inch.fY / 2;

    //console.log("Inch: " + inch.fX + " x " + inch.fY);
}

function isHighDensity(){
    return ((platform.matchMedia && (platform.matchMedia('only screen and (min-resolution: 124dpi), only screen and (min-resolution: 1.3dppx), only screen and (min-resolution: 48.8dpcm)').matches || platform.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (min-device-pixel-ratio: 1.3)').matches)) || (platform.devicePixelRatio && platform.devicePixelRatio > 1.3));
}

function isRetina(){
    return ((platform.matchMedia && (platform.matchMedia('only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx), only screen and (min-resolution: 75.6dpcm)').matches || platform.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min--moz-device-pixel-ratio: 2), only screen and (min-device-pixel-ratio: 2)').matches)) || (platform.devicePixelRatio && platform.devicePixelRatio >= 2)) && /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
}

function detectScreen() {
	calculateInch();
	
	if (isRetina()) {
		return 2;
	} else if (isHighDensity()) {
		return 1.5;
	}
	
	return 1;
}

// Full Screen

export const evFullScreen = 'evFullScreen';

const classFullScreen = 'fullscreen';

const sRequestFullscreen = 'requestFullscreen';
const sMozRequestFullScreen = 'mozRequestFullScreen';
const sWebkitRequestFullscreen = 'webkitRequestFullscreen';

export function enterFullScreen(domTarget) {
	if (domTarget[sRequestFullscreen]) {
		domTarget[sRequestFullscreen]();
	} else if (domTarget[sMozRequestFullScreen]) {
		domTarget[sMozRequestFullScreen]();
	} else if (domTarget[sWebkitRequestFullscreen]) {
		domTarget[sWebkitRequestFullscreen](Element['ALLOW_KEYBOARD_INPUT']);
	}
}

const sCancelFullScreen = 'cancelFullScreen';
const sMozCancelFullScreen = 'mozCancelFullScreen';
const sWebkitCancelFullScreen = 'webkitCancelFullScreen';

export function exitFullScreen() {
	if (platform.document[sCancelFullScreen]) {
		platform.document[sCancelFullScreen]();
	} else if (platform.document[sMozCancelFullScreen]) {
		platform.document[sMozCancelFullScreen]();
	} else if (platform.document[sWebkitCancelFullScreen]) {
		platform.document[sWebkitCancelFullScreen]();
	}
}

export function toggleFullScreen(domTarget) {
	if (!platform.document['fullscreenElement'] && !platform.document['mozFullScreenElement'] && !platform.document['webkitFullscreenElement']) {
		enterFullScreen(domTarget);
	} else {
		exitFullScreen();
	}
};

/**
 * @param {Event} oEvent 
 */
function onFullScreenChange(oEvent) {
    let bState = platform.document['fullScreen'] || platform.document['mozFullScreen'] || platform.document['webkitIsFullScreen'];
    let bFullScreen = bState ? true : false;
    if (bState)
		platform.document.body.classList.add(classFullScreen);
    else
		platform.document.body.classList.remove(classFullScreen);
    
	MessagePool.post(evFullScreen, oEvent.target, bFullScreen);
}

bindEvent(platform.document, 'webkitfullscreenchange', onFullScreenChange);
bindEvent(platform.document, 'mozfullscreenchange', onFullScreenChange);
bindEvent(platform.document, 'fullscreenchange', onFullScreenChange);
bindEvent(platform.document, 'MSFullscreenChange', onFullScreenChange);
