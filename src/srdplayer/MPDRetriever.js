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

/* Script to retrieve MPD files from remote server.
 * This server needs to support cross origin requests.
 * CrossOriginRequest.js from the utils directory is used 
 * to perform the requests.
 */


"use strict";

var MPDRetriever = function (params) {
  this.params = params;
};

MPDRetriever.prototype = {
  retrieveAndConvert: function (mpdURL, callback) {

    crossOriginRequest(mpdURL, function (err, data) {

      if (err) {

        return err;
      }
      callback(null, data);
    });

  },

  getMPD: function () {

    var mpdURL = this.params.mpdURL;

    this.retrieveAndConvert(mpdURL, function (err, data) {

      if (err) {

        console.log(err);

      } else {

        ServiceBus.publish("MPD-incoming", [mpdURL, data]);

      }

    });
  }
};
