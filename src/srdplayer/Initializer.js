/* 
* The copyright in this software is being made available under the following 
* TNO license terms. This software may be subject to other third party and 
* TNO intellectual property rights, including patent rights, 
* and no such rights are granted under this license.
*
* Created by Jorrit van den Berg on 7/12/15.
* Copyright (c) 2016, TNO.
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
*  * Redistributions of source code must retain the above copyright notice,
*    this list of conditions and the following disclaimer.
*  * Redistributions in binary form must reproduce the above copyright notice,
*    this list of conditions and the following disclaimer in the documentation
*    and/or other materials provided with the distribution.
*  * Neither the name of TNO nor the names of its employees may
*    be used to endorse or promote products derived from this software without
*    specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY TNO "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, 
* INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND 
* FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL TNO
* BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
* CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
* SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
* INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
* CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
* ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
* THE POSSIBILITY OF SUCH DAMAGE.
*/

// Declaration of global variables

var SRDPlayer,
    videoContainer,
    bannerbox,
    frameRate,
    fallBackLayer,
    zoomLayer1,
    zoomLayer2,
    video1,
    video2,
    video3,
    video4,
    video5,
    video6,
    video7,
    video8,
    video9,
    video10,
    video11,
    video12,
    video13,
    video14,
    video15,
    video16,
    zoomLayer1VideoElements,
    zoomLayer2VideoElements,
    timingObject,
    syncFallBackLayer,
    syncVideo1,
    syncVideo2,
    syncVideo3,
    syncVideo4,
    syncVideo5,
    syncVideo6,
    syncVideo7,
    syncVideo8,
    syncVideo9,
    syncVideo10,
    syncVideo11,
    syncVideo12,
    syncVideo13,
    syncVideo14,
    syncVideo15,
    syncVideo16,
    zoomLayer1VideoSyncObjects,
    zoomLayer2VideoSyncObjects,
    visibleElement,
    zoomLayer1PlayerObjects,
    zoomLayer2PlayerObjects,
    videoController,
    getClickPositionEnabled,
    mpdURL,
    inMPD,
    currentZoomLevel,
    maxZoomLevel,
    fullScreenFlag,
    browserType,
    browserWindowZoomedTo,
    fullScreenZoomedTo,
    duration,
    initialWidth,
    initialHeight,
    initialAspectRatio,
    fallBackLayerContentWidth,
    fallBackLayerContentHeight,
    fallBackLayerContentAspectRatio,
    zoomLayer1ContentWidth,
    zoomLayer1ContentHeight,
    zoomLayer1ContentAspectRatio,
    zoomLayer2ContentWidth,
    zoomLayer2ContentHeight,
    zoomLayer2ContentAspectRatio,
    screenAspectRatio,
    contentHasAudio,
    contentAspectRatio,
    lastVolumeValue,
    masterQuality,
    videoControllerClone,
    viewState,
    zoomLayer1VideoHeight,
    zoomLayer1VideoWidth,
    zoomLayer2VideoHeight,
    zoomLayer2VideoWidth,
    tileUnitType,
    spatialOrderingZoomLevel1,
    spatialOrderingZoomLevel2,
    spatialOrderingDimensionsZoomLevel1,
    spatialOrderingDimensionsZoomLevel2,
    zoomLevel1TilesHorizontal,
    zoomLevel2TilesHorizontal,
    zoomLevel1TilesVertical,
    zoomLevel2TilesVertical,
    zoomLayer1Hammer,
    zoomLayer2Hammer;

/* Variable assignments to be executed when DOM loading is finished.
 * This is needed to get hooks to DOM elements and do some settings.
 * If you want to change the id of DOM elements in your HTML file (e.g. zoomLayer1 or video1),
 * be sure to change them here as well in each occurence: 
 * document.getElementById("<yourElementId>") 
 */

$(document).ready(function () {
    SRDPlayer = document.getElementById("SRDPlayer");
    videoContainer = document.getElementById("videoContainer");
    bannerbox = document.getElementById("bannerbox");
    fallBackLayer = document.getElementById("fallBackLayer");
    zoomLayer1 = document.getElementById("zoomLayer1");
    zoomLayer2 = document.getElementById("zoomLayer2");
    video1 = document.getElementById("video1");
    video2 = document.getElementById("video2");
    video3 = document.getElementById("video3");
    video4 = document.getElementById("video4");
    video5 = document.getElementById("video5");
    video6 = document.getElementById("video6");
    video7 = document.getElementById("video7");
    video8 = document.getElementById("video8");
    video9 = document.getElementById("video9");
    video10 = document.getElementById("video10");
    video11 = document.getElementById("video11");
    video12 = document.getElementById("video12");
    video13 = document.getElementById("video13");
    video14 = document.getElementById("video14");
    video15 = document.getElementById("video15");
    video16 = document.getElementById("video16");
    videoController = document.getElementById("videoController");

    zoomLayer1VideoElements = [video1, video2, video3, video4];
    zoomLayer2VideoElements = [video5, video6, video7, video8,
        video9, video10, video11, video12,
        video13, video14, video15, video16];

    zoomLayer1VideoSyncObjects = [syncVideo1, syncVideo2, syncVideo3, syncVideo4];
    zoomLayer2VideoSyncObjects = [syncVideo5, syncVideo6, syncVideo7, syncVideo8,
        syncVideo9, syncVideo10, syncVideo11, syncVideo12,
        syncVideo13, syncVideo14, syncVideo15, syncVideo16];

    zoomLayer1PlayerObjects = [];
    zoomLayer2PlayerObjects = [];
    spatialOrderingZoomLevel1 = [];
    spatialOrderingZoomLevel2 = [];

    fallBackLayer.style.visibility = 'visible';
    zoomLayer1.style.visibility = 'hidden';
    zoomLayer2.style.visibility = 'hidden';

    video1.muted = true;
    video2.muted = true;
    video3.muted = true;
    video4.muted = true;
    video5.muted = true;
    video6.muted = true;
    video7.muted = true;
    video8.muted = true;
    video9.muted = true;
    video10.muted = true;
    video11.muted = true;
    video12.muted = true;
    video13.muted = true;
    video14.muted = true;
    video15.muted = true;
    video16.muted = true;
    getClickPositionEnabled = false;
    fullScreenFlag = false;
    browserType = detectBrowser();

    /* Construct Hammer.js instances for gesture events on mobile devices.
       (currently this is not functional due to an import error of the Hammer.js library) */

    zoomLayer1Hammer = new Hammer(zoomLayer1, {

        recognizers: [[Hammer.Pan, { direction: Hammer.DIRECTION_ALL }],]
    });

    zoomLayer2Hammer = new Hammer(zoomLayer2, {

        recognizers: [[Hammer.Pan, { direction: Hammer.DIRECTION_ALL }],]
    });
});
