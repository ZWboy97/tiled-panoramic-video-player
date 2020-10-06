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

/* Script to handle the start of a video and bitrate changes.
 * Bitrate changes on the left upper tile/dash.js instance (in a zoomed in condition)
 * are propagated to the other playing dash.js instances within that layer.
 */

function initiatePlayBack(fallBackLayer, videoList, viewLayer) {

    if (!fallBackLayer.paused) {
        $("#fallBackLayer").one("timeupdate", function () {
            timingObject.update({
                position: fallBackLayer.currentTime,
                velocity: 1.0 // step
            });
            for (var i = 0; i < videoList.length; i++) {
                var videoTile = videoList[i];

                if (viewLayer == zoomLayer1) {
                    zoomLayer2VideoSyncObjects[i] = null;
                    zoomLayer1VideoSyncObjects[i] = new TIMINGSRC.MediaSync(zoomLayer1VideoElements[i], timingObject);
                } else {
                    zoomLayer1VideoSyncObjects[i] = null;
                    zoomLayer2VideoSyncObjects[i] = new TIMINGSRC.MediaSync(zoomLayer2VideoElements[i], timingObject);
                }
            }
        });
        // setTimeout(function () {
        //     $("#fallBackLayer").one("timeupdate", function () {
        //         console.log("time update")
        //         if (!fallBackLayer.paused) {
        //             timingObject.update({
        //                 position: fallBackLayer.currentTime + 0.001,
        //                 velocity: 1.0
        //             });
        //         }
        //     });
        // }, 500);
    } else {
        timingObject.update({ position: fallBackLayer.currentTime, velocity: 0.0 });
        for (var i = 0; i < videoList.length; i++) {
            var videoTile = videoList[i];
            if (viewLayer == zoomLayer1) {
                zoomLayer2VideoSyncObjects[i] = null;
                zoomLayer1VideoSyncObjects[i] = new TIMINGSRC.MediaSync(zoomLayer1VideoElements[i], timingObject);
            } else {
                zoomLayer1VideoSyncObjects[i] = null;
                zoomLayer2VideoSyncObjects[i] = new TIMINGSRC.MediaSync(zoomLayer2VideoElements[i], timingObject);
            }
        }
    }

    // 以分开的第一个视频作为masterVideo，由其决定整体的视频码率
    // 之后采用基于最优化的方式来选择整体视频码率
    var masterVideo;
    if (currentZoomLevel == 1) {
        masterVideo = "#video1";
    } else if (currentZoomLevel == 2) {
        masterVideo = "#video5";
    }

    // 整体质量选择
    $(masterVideo).one("loadeddata", function () {
        // 在第一帧数据加载成功之后触发
        var playerContainer = [];
        if (currentZoomLevel == 1) {
            playerContainer = zoomLayer1PlayerObjects;
        } else if (currentZoomLevel == 2) {
            playerContainer = zoomLayer2PlayerObjects;
        }

        for (var i = 0; i < playerContainer.length; i++) {
            var player = playerContainer[i];
            if (i === 0) {
                if (player.getBitrateInfoListFor("video").length > 1) {
                    masterQuality = player.getQualityFor("video");
                }
            } if (i > 0 && masterQuality) {
                player.setQualityFor("video", masterQuality);
            }
        }

        if (masterQuality) {
            emitBitrateChanges(playerContainer, masterQuality);
        }
    });
}

// 更改整体的视频质量
function emitBitrateChanges(playerList, masterQuality) {

    playerList[0].eventBus.addEventListener(MediaPlayer.events.METRIC_CHANGED, function () {
        var currentQuality = playerList[0].getQualityFor("video");
        if (masterQuality != currentQuality) {
            masterQuality = currentQuality;
            for (var i = 1; i < playerList.length; i++) {
                var player = playerList[i];

                if (i > 0) {
                    player.setQualityFor("video", masterQuality);
                }
            }
        }
    });
}

// 当所有tile ready 时候，切换
function updateViewLayerOnReadyState(videoElementsList, xPosition, yPosition, viewLayer) {

    for (var i = 0; i < videoElementsList.length; i++) {

        if (!videoElementsList[i].ReadyState === 4) {
            i -= 1;
            // 没准备好，循环
        }
    }
    updateVideoContainer(xPosition, yPosition, viewLayer, 1000, null);
}