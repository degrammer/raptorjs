/*
 * Copyright 2011 eBay Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @extension Node
 */
define("raptor/stacktraces", function() {
    "use strict";

    return {
        trace : function(e) {
            var out = [];
            while (e) {
                
                out[out.length] = '' + (e.stack || e.message || e);
                
                e = e._cause;
                if (e) {
                    out[out.length] = '\n\nCaused by:\n';
                }
            }
            return 'Stack trace:\n' +  out.join('');
        }
    };    
});