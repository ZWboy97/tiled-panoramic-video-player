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

/* Script to parse JSON extracted from incoming MPD file 
 * and fire either an SRD-MPD event or a Non-SRD-MPD event
 * based on the presence of the SupplementalProperty from the
 * Spatial Reference Description. The MPD is included as 
 * payload of the event message. This is an XML file which
 * is converted to JSON with the script xml2json.js in the 
 * utils directory.
 */

"use strict";

var MPDParser = function () {
  ServiceBus.subscribe("MPD-incoming", this.parseMPD, "MPDParser");
};

MPDParser.prototype = {
  parseMPD: function (data) {

    mpdURL = data[0];

    var x2js = new X2JS(matchers, '', true);
    var mpdJSON = x2js.xml_str2json(data[1]);
    console.log('mpdJson', mpdJSON);

    if ($.isArray(mpdJSON.Period.AdaptationSet)) {

      if ("SupplementalProperty" in mpdJSON.Period.AdaptationSet[0]) {

        ServiceBus.publish("SRD-MPD", [mpdURL, mpdJSON]);

      } else {

        ServiceBus.publish("Non-SRD-MPD", [mpdURL, mpdJSON]);

      }

    } else {

      if ("SupplementalProperty" in mpdJSON.Period.AdaptationSet) {

        ServiceBus.publish("SRD-MPD", [mpdURL, mpdJSON]);

      } else {

        ServiceBus.publish("Non-SRD-MPD", [mpdURL, mpdJSON]);

      }
    }


  }
};
