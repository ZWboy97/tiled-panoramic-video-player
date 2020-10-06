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

/* Attaches MPD or a part of it to Dash.js instance in the form 
 * of an MPD object. There are two attacher types, the normalVideoAttacher 
 * for (non SRD) legacy content and the tiledVideoAttacher.
 * The tiledVideoAttacher has three prototypes:
 * - fallBackLayerAttacher
 * - zoomLayer1Attacher
 * - zoomLayer2Attacher 
 *
 * The normalVideoAttacher and fallBackLayerAttacher 
 * subscribe to an event (either Non-SRD-MPD or SRD-MPD) 
 * which is triggered when a MPD file is parsed. The zoomLayerAttachers get 
 * triggered by a UI event, which is handled by UIEventHandlers.js 
 */

var normalVideoAttacher = function () {

    ServiceBus.subscribe("Non-SRD-MPD", this.attacher, "normalVideoAttacher");

};

normalVideoAttacher.prototype = {
    attacher: function (data) {

        if (getClickPositionEnabled === true) {

            videoContainer.removeEventListener("dblclick", getClickPosition);
        }

        var player = launchDashPlayer("fallBackLayer");
        player.attachSource(data);

        $.when(fallBackLayer.readyState === 4).then((function () {
            playPause();
        }));

    }

};

var tiledVideoAttacher = function () {

    ServiceBus.subscribe("SRD-MPD", this.fallBackLayerAttacher, "fallBackLayerAttacher");
    ServiceBus.subscribe("Zoom-level1", this.zoomLayer1Attacher, "zoomLayer1Attacher");
    ServiceBus.subscribe("Zoom-level2", this.zoomLayer2Attacher, "zoomLayer2Attacher");

};

tiledVideoAttacher.prototype = {

    fallBackLayerAttacher: function (data) {

        var fallBackLayerAdaptationSet;
        inMPD = data[1];
        var adaptationSets = inMPD.Period.AdaptationSet;
        // 取第一个adaptation
        var videoAdaptationSet = adaptationSets.slice(0, 1);
        // 取第二个adaptation，
        var secondAdaptationSet = adaptationSets.slice(1, 2);
        // 通过第二个adaptation的类型判断该MPD内容是否带音频
        if (secondAdaptationSet[0].mimeType == "audio/mp4") {
            fallBackLayerAdaptationSet = [videoAdaptationSet[0], secondAdaptationSet[0]];
            contentHasAudio = true;
        } else {
            fallBackLayerAdaptationSet = videoAdaptationSet;
            contentHasAudio = false;
        }
        // 从MPD中读取segment的帧率，高度和宽度，设置为其宽度，屏幕比率
        frameRate = videoAdaptationSet[0].Representation.frameRate;
        // 基于MPD内容参数更新播放器宽高参数
        fallBackLayerContentWidth = videoAdaptationSet[0].Representation.width;
        fallBackLayerContentHeight = videoAdaptationSet[0].Representation.height;
        fallBackLayerContentAspectRatio = fallBackLayerContentWidth / fallBackLayerContentHeight;
        if (fallBackLayerContentAspectRatio != initialAspectRatio) {
            updateAspectRatio(fallBackLayer, fallBackLayerContentAspectRatio);
        }

        // 组装MPD，并交给player处理
        var fallBackLayerMPD = {
            "__cnt": inMPD.__cnt,
            "#comment": inMPD["#comment"],
            "#comment_asArray": inMPD["#comment_asArray"],
            BaseURL: inMPD.BaseURL,
            BaseURL_asArray: inMPD.BaseURL_asArray,
            Period: { "__cnt": inMPD.Period.__cnt, AdaptationSet: fallBackLayerAdaptationSet, AdaptationSet_asArray: fallBackLayerAdaptationSet, __children: fallBackLayerAdaptationSet },
            Period_asArray: [{ AdaptationSet: fallBackLayerAdaptationSet, AdaptationSet_asArray: fallBackLayerAdaptationSet, __children: fallBackLayerAdaptationSet }],
            xmlns: inMPD.xmlns,
            mediaPresentationDuration: inMPD.mediaPresentationDuration,
            minBufferTime: inMPD.minBufferTime,
            profiles: inMPD.profiles,
            type: inMPD.type,
            __text: inMPD.__text
        };

        var player = launchDashPlayer("fallBackLayer");
        var source = [mpdURL, fallBackLayerMPD];
        player.attachSource(source);

        $("#fallBackLayer").one("canplay", function () {

            if (fallBackLayer.paused) {
                // 自动播放
                fallBackLayer.play();
                if ($("#iconPlayPause").hasClass("icon-play")) {
                    $("#iconPlayPause").removeClass("icon-play");
                }

                if (!$("#iconPlayPause").hasClass("icon-pause")) {
                    $("#iconPlayPause").toggleClass("icon-pause");
                }
            }

            // Set the video duration
            duration = fallBackLayer.duration;
            document.getElementById("videoDuration").innerHTML = secondsToTimeString(duration);

            // Set the videotimer    
            var timerInterval = duration / 2;
            console.log('timerInterval', duration)

            // Add pseudo class to seekbar if user is moving the scrubber,
            // otherwise it can not be moved
            var seekbar = document.getElementById("seekbar");
            seekbar.setAttribute('max', duration);
            seekbar.setAttribute('onmousedown', '$("#seekbar").toggleClass("user-seek");');
            seekbar.setAttribute('onmouseup', '$("#seekbar").removeClass("user-seek");');

            var videoTimer = setInterval(function () {
                document.getElementById("videoTime").innerHTML = secondsToTimeString(fallBackLayer.currentTime);

                if (!$("#seekbar").hasClass("user-seek")) {
                    $("#seekbar").val(fallBackLayer.currentTime);

                } else {
                    fallBackLayer.currentTime = $("#seekbar").val();
                    if (timingObject) {
                        timingObject.update({ position: $("#seekbar").val(), velocity: 0.0 });
                        timingObject.update({ velocity: 1.0 });
                    }
                }

                if (fallBackLayer.currentTime == duration) {
                    clearInterval(videoTimer);
                }

            }, timerInterval);

            $("#volumebar").bind("change", function () {
                var val = this.value;
                fallBackLayer.volume = val;
            });
        });

        // 从MPD中读取ZoomLevel
        var supplementalPropertyValue = adaptationSets[0].SupplementalProperty.value;
        currentZoomLevel = supplementalPropertyValue.substr(supplementalPropertyValue.length - 1);

        if (getClickPositionEnabled === false) {
            videoContainer.addEventListener("dblclick", onClickEvent, false);
            getClickPositionEnabled = true;
        }

        // 从MPD中读取最高质量的level，maxZoomLevel
        var lastVideoIndex = adaptationSets.length;
        var lastVideo = adaptationSets.slice((lastVideoIndex - 1), lastVideoIndex);
        var essentialPropertyValueLength = lastVideo[0].EssentialProperty.value.length;
        maxZoomLevel = lastVideo[0].EssentialProperty.value.slice((essentialPropertyValueLength - 1), essentialPropertyValueLength);

        // 将video内容赋予orderedAdaptation
        var orderedAdaptationSets = fallBackLayerAdaptationSet;
        if (contentHasAudio == false) {
            var o = 0;
            var orderedAdaptationSets = [fallBackLayerAdaptationSet[0]];
        } else {
            var o = 1;
            var orderedAdaptationSets = fallBackLayerAdaptationSet;
        }
        // 如果有audio，需要跳过第二个
        // 遍历所有的adaptionSets，装配到空间关系排序列表中
        for (var i = 1 + o; i < adaptationSets.length; i++) {
            // 读取第i个adaptionSet的level
            var essentialPropertyValue = adaptationSets[i].EssentialProperty.value;
            var essentialPropertyValueAsArray = essentialPropertyValue.split(",");
            var essentialPropertyValueLength = essentialPropertyValueAsArray.length;
            var zoomLevel = essentialPropertyValueAsArray.slice((essentialPropertyValueLength - 1), essentialPropertyValueLength);

            if (zoomLevel == 1) {

                if (i == 1 + o) {
                    // 每个adaptationSet中可以有多个represention
                    if ($.isArray(adaptationSets[i].Representation)) {
                        // 默认选择最大的分辨率
                        zoomLayer1ContentWidth = adaptationSets[i].Representation[0].width;
                        zoomLayer1ContentHeight = adaptationSets[i].Representation[0].height;
                    } else {
                        zoomLayer1ContentWidth = adaptationSets[i].Representation.width;
                        zoomLayer1ContentHeight = adaptationSets[i].Representation.height;
                    }
                    // 计算zoom1的aspect
                    zoomLayer1ContentAspectRatio = zoomLayer1ContentWidth / zoomLayer1ContentHeight;
                    // 判断SRD的分块参数类型，是二进制还是通过像素
                    if (essentialPropertyValueAsArray[3] == 1 && essentialPropertyValueAsArray[4] == 1) {
                        tileUnitType = "arbitrary units";
                    } else {
                        tileUnitType = "pixel units";
                    }
                }
                // 将level为1的，存储到spatialOrderingZoomLevel1中
                spatialOrderingZoomLevel1.push({
                    index: i,
                    x: essentialPropertyValueAsArray[1],
                    y: essentialPropertyValueAsArray[2] // 块的空间位置坐标
                });
            } else if (zoomLevel == 2) {
                // 同上，将level为2的装配到spatialOrderingZoomLevel2中
                var firstIterationFlag = true;
                if (firstIterationFlag) {
                    if ($.isArray(adaptationSets[i].Representation)) {
                        zoomLayer2ContentWidth = adaptationSets[i].Representation[0].width;
                        zoomLayer2ContentHeight = adaptationSets[i].Representation[0].height;
                    } else {
                        zoomLayer2ContentWidth = adaptationSets[i].Representation.width;
                        zoomLayer2ContentHeight = adaptationSets[i].Representation.height;
                    }
                    zoomLayer2ContentAspectRatio = zoomLayer2ContentWidth / zoomLayer2ContentHeight;
                    firstIterationFlag = false;
                }
                spatialOrderingZoomLevel2.push({
                    index: i,
                    x: essentialPropertyValueAsArray[1],
                    y: essentialPropertyValueAsArray[2]
                });
            }
        }

        if (spatialOrderingZoomLevel1.length > 0) {
            // 按照x,y的大小，进行排序
            spatialOrderingZoomLevel1 = spatialOrderingZoomLevel1.sort(orderByProperty('x', 'y'));
            // 加入到有序候选项中
            for (var i = 0; i < spatialOrderingZoomLevel1.length; i++) {
                var index = spatialOrderingZoomLevel1[i]['index'];
                orderedAdaptationSets.push(adaptationSets[index]);
            }
            // 统计水平和垂直方向上各被分割成几个tile
            spatialOrderingDimensionsZoomLevel1 = countUniques(spatialOrderingZoomLevel1);
            zoomLevel1TilesHorizontal = spatialOrderingDimensionsZoomLevel1[1].slice(0, 1);
            zoomLevel1TilesVertical = spatialOrderingDimensionsZoomLevel1[0].length;
        }
        // 同上，level2的也加入到orderedAdaptationSets中
        if (spatialOrderingZoomLevel2.length > 0) {
            spatialOrderingZoomLevel2 = spatialOrderingZoomLevel2.sort(orderByProperty('x', 'y'));
            for (var i = 0; i < spatialOrderingZoomLevel2.length; i++) {
                var index = spatialOrderingZoomLevel2[i]['index'];
                orderedAdaptationSets.push(adaptationSets[index]);
            }
            spatialOrderingDimensionsZoomLevel2 = countUniques(spatialOrderingZoomLevel2);
            zoomLevel2TilesHorizontal = spatialOrderingDimensionsZoomLevel2[1].slice(0, 1);
            zoomLevel2TilesVertical = spatialOrderingDimensionsZoomLevel2[0].length;
        }
        // 跟新inMPD的AdaptationSet为orderedAdaptationSets
        // inMPD解析完毕，等待切换用户双击切换
        inMPD.Period.AdaptationSet = orderedAdaptationSets;
    },

    zoomLayer1Attacher: function (data) {

        var adaptationSets = inMPD.Period.AdaptationSet;
        var tileMPDs = [];
        var xPosition = data[0];
        var yPosition = data[1];
        var viewLayer = data[2];

        if (contentHasAudio == false) {
            var o = 0;
        } else {
            var o = 1;
        }

        for (var i = 1 + o; i < adaptationSets.length; i++) {

            var essentialPropertyValueLength = adaptationSets[i].EssentialProperty.value.length;
            var zoomLevel = adaptationSets[i].EssentialProperty.value.slice((essentialPropertyValueLength - 1), essentialPropertyValueLength);

            if (zoomLevel == currentZoomLevel) {

                var arrayIndex = i - (1 + o);
                tileMPDs[arrayIndex] = {
                    "__cnt": inMPD.__cnt,
                    "#comment": inMPD["#comment"],
                    "#comment_asArray": inMPD["#comment_asArray"],
                    BaseURL: inMPD.BaseURL,
                    BaseURL_asArray: inMPD.BaseURL_asArray,
                    Period: { "__cnt": inMPD.Period.__cnt, AdaptationSet: adaptationSets[i], AdaptationSet_asArray: [adaptationSets[i]], __children: adaptationSets[i] },
                    Period_asArray: [{ AdaptationSet: adaptationSets[i], AdaptationSet_asArray: [adaptationSets[i]], __children: adaptationSets[i] }],
                    xmlns: inMPD.xmlns,
                    mediaPresentationDuration: inMPD.mediaPresentationDuration,
                    minBufferTime: inMPD.minBufferTime,
                    profiles: inMPD.profiles,
                    type: inMPD.type,
                    __text: inMPD.__text
                };

                if (i == 1 + o) {

                    if ($.isArray(adaptationSets[i].Representation)) {

                        zoomLayer1ContentWidth = adaptationSets[i].Representation[0].width;
                        zoomLayer1ContentHeight = adaptationSets[i].Representation[0].height;

                    } else {

                        zoomLayer1ContentWidth = adaptationSets[i].Representation.width;
                        zoomLayer1ContentHeight = adaptationSets[i].Representation.height;

                    }

                    zoomLayer1ContentAspectRatio = zoomLayer1ContentWidth / zoomLayer1ContentHeight;


                }

            } else if (zoomLevel > currentZoomLevel) {
                break;
            }

        }

        zoomLayer1PlayerObjects = [];

        timingObject = new TIMINGSRC.TimingObject({ position: fallBackLayer.currentTime });

        for (var i = 0; i < zoomLayer1VideoElements.length; i++) {
            var videoElement = "video" + (i + 1);
            var player = launchDashPlayer(videoElement);
            player.setAutoSwitchQuality(false);
            zoomLayer1PlayerObjects.push(player);
        }

        for (var i = 0; i < zoomLayer1PlayerObjects.length; i++) {
            var player = zoomLayer1PlayerObjects[i];
            var source = [mpdURL, tileMPDs[i]];
            player.attachSource(source);
        }

        initiatePlayBack(fallBackLayer, zoomLayer1VideoElements, viewLayer);
        updateViewLayerOnReadyState(zoomLayer1VideoElements, xPosition, yPosition, viewLayer);

        if (getClickPositionEnabled === false) {

            videoContainer.addEventListener("dblclick", onClickEvent, false);
            getClickPositionEnabled = true;

        }

    },

    zoomLayer2Attacher: function (data) {

        var tile1,
            tile2,
            tile3,
            tile4,
            tile5,
            tile6,
            tile7,
            tile8;

        // inMPD之前被fallbackLayer初始化的时候修饰排序过
        var adaptationSets = inMPD.Period.AdaptationSet;
        // 每个Dash播放器都需要一个
        var tileMPDs = [];
        // 哪些块被选中，需要播放。挺重要
        var selectedTiles = [];
        // 用户在上一个level点击的positon，暂时用不到
        var xPosition = data[0];
        var yPosition = data[1];
        // 展示的levelView
        var viewLayer = data[2];
        // 计算视频的aspect
        var videoContainerWidth = parseInt(videoContainer.offsetWidth, 10);
        var videoContainerHeight = parseInt(videoContainer.offsetHeight, 10);

        // 计算被点击的块所在的tile的编号
        var selectedTileX = Math.ceil(Math.abs(xPosition) / (videoContainerWidth / zoomLevel2TilesHorizontal));
        var selectedTileY = Math.ceil(Math.abs(yPosition) / (videoContainerHeight / zoomLevel2TilesVertical));
        var selectedTile1D = (selectedTileY - 1) * zoomLevel2TilesHorizontal + selectedTileX;

        var numberOfTilesZoomLayer1 = zoomLevel1TilesHorizontal * zoomLevel1TilesVertical;

        // TODO，对应到12个播放器上，之后需要改进成，各个位置的分块是否播放
        selectedTiles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

        if (contentHasAudio == false) {
            var o = 0;
        } else {
            var o = 1;
        }
        for (var i = 1 + o; i < adaptationSets.length; i++) {

            var essentialPropertyValueLength = adaptationSets[i].EssentialProperty.value.length;
            var zoomLevel = adaptationSets[i].EssentialProperty.value.slice((essentialPropertyValueLength - 1), essentialPropertyValueLength);

            if (i == 1 + o) {
                var n = 0;
                var tileNumber = selectedTiles[n];
                // 用第一个representation计算宽高aspect
                if ($.isArray(adaptationSets[i].Representation)) {
                    zoomLayer2ContentWidth = adaptationSets[i].Representation[0].width;
                    zoomLayer2ContentHeight = adaptationSets[i].Representation[0].height;
                } else {
                    zoomLayer2ContentWidth = adaptationSets[i].Representation.width;
                    zoomLayer2ContentHeight = adaptationSets[i].Representation.height;
                }
                zoomLayer2ContentAspectRatio = zoomLayer2ContentWidth / zoomLayer2ContentHeight;
            }

            // 如果命中，则为其创建MPD结构
            // TODO 这个写法太烂了，之后优化一下吧
            if (i == (tileNumber + o + numberOfTilesZoomLayer1)) {
                var arrayIndex = n;
                tileMPDs[arrayIndex] = {
                    "__cnt": inMPD.__cnt,
                    "#comment": inMPD["#comment"],
                    "#comment_asArray": inMPD["#comment_asArray"],
                    BaseURL: inMPD.BaseURL,
                    BaseURL_asArray: inMPD.BaseURL_asArray,
                    Period: { "__cnt": inMPD.Period.__cnt, AdaptationSet: adaptationSets[i], AdaptationSet_asArray: [adaptationSets[i]], __children: adaptationSets[i] },
                    Period_asArray: [{ AdaptationSet: adaptationSets[i], AdaptationSet_asArray: [adaptationSets[i]], __children: adaptationSets[i] }],
                    xmlns: inMPD.xmlns,
                    mediaPresentationDuration: inMPD.mediaPresentationDuration,
                    minBufferTime: inMPD.minBufferTime,
                    profiles: inMPD.profiles,
                    type: inMPD.type,
                    __text: inMPD.__text
                };
                n += 1;
                tileNumber = selectedTiles[n];
            }
        }

        // 设置视频同步源为fallBackLayer
        timingObject = new TIMINGSRC.TimingObject({ position: fallBackLayer.currentTime });

        // 初始化所有的Dash播放器实例
        zoomLayer2PlayerObjects = [];
        for (var i = 0; i < zoomLayer2VideoElements.length; i++) {
            var videoElement = "video" + (i + 5);
            var player = launchDashPlayer(videoElement);
            player.setAutoSwitchQuality(false);
            zoomLayer2PlayerObjects.push(player);
        }
        console.log('tileMpds', tileMPDs)
        // 启动每个播放器的播放以及同步
        for (var i = 0; i < zoomLayer2PlayerObjects.length; i++) {
            var player = zoomLayer2PlayerObjects[i];
            var source = [mpdURL, tileMPDs[i]];
            zoomLayer1VideoSyncObjects[i] = null;
            zoomLayer2VideoSyncObjects[i] = new TIMINGSRC.MediaSync(zoomLayer2VideoElements[i], timingObject);
            player.attachSource(source);
        }
        initiatePlayBack(fallBackLayer, zoomLayer2VideoElements, viewLayer);
        // 当所有的播放器都ready的时候，切换过去
        updateViewLayerOnReadyState(zoomLayer2VideoElements, xPosition, yPosition, viewLayer);
    }
};


