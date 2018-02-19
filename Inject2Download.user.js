// ==UserScript==
// @name         Inject2Download
// @namespace    http://lkubuntu.wordpress.com/
// @version      0.2.8.3
// @description  Simple media download script
// @author       Anonymous Meerkat
// @include      *
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    "use strict";

    var injected_set = {};

    // Helper functions
    function i2d_show_url(namespace, url, description) {
        function get_absolute_url(url) {
            var a = document.createElement('a');
            a.href = url;
            return a.href;
        }

        function run_on_load(f) {
            if (document.readyState === "complete" ||
                document.readyState === "interactive") {
                f();
            } else {
                var listener = function() {
                    if (document.readyState === "complete" ||
                        document.readyState === "interactive") {
                        f();

                        document.removeEventListener("readystatechange", listener);
                    }
                };

                document.addEventListener("readystatechange", listener);
                //document.addEventListener('DOMContentLoaded', f, false);
                //window.addEventListener('load', f, false);
            }
        }

        if (!description)
            description = "";

        if (typeof url !== "string" || url.replace("\s", "").length === 0)
            return;

        if (url.match(/^mediasource:/) || url.match(/^blob:/))
            return;

        url = get_absolute_url(url);

        if (!("i2d_url_list" in window))
            window.i2d_url_list = [];

        for (var i = 0; i < i2d_url_list.length; i++) {
            if (i2d_url_list[i][0] === namespace &&
                i2d_url_list[i][1] === url &&
                i2d_url_list[i][2] === description)
                    return;
        }


        i2d_url_list.push([namespace, url, description]);

        var newurl = decodeURIComponent(url);

        var text = "[" + namespace + "] " + description + ": ";

        console.log("[i2d] " + text + newurl);

        run_on_load(function() {
            var el = document.getElementById("i2d-popup");
            var elspan = document.getElementById("i2d-popup-x");
            var elspan1 = document.getElementById("i2d-popup-close");
            var eldiv = document.getElementById("i2d-popup-div");
            var eldivhold = document.getElementById("i2d-popup-div-holder");
            if (!el) {
                el = document.createElement("div");
                //el.style.position = "absolute";
                el.style.width = "max(60%, 100em)";
                el.style.height = "max(60%, 100em)";
                el.style.maxWidth = "100%";
                el.style.maxHeight = "100%";
                el.style.height = "auto";
                el.style.width = "auto";
                el.style.background = "white";
                el.style.top = "0px";
                el.style.left = "0px";
                el.style.zIndex = Number.MAX_SAFE_INTEGER - 1;
                el.style.color = "black";
                el.style.fontFamily = "sans-serif";
                el.style.fontSize = "16px";
                el.style.lineHeight = "normal";
                el.style.textAlign = "left";
                el.style.overflow = "scroll";
                /*el.ondblclick = function() {
                  el.parentElement.removeChild(el);
                  };*/
                eldivhold = document.createElement("div");
                eldivhold.id = "i2d-popup-span-holder";
                eldivhold.style.width = "100%";
                eldivhold.style.display = "block";
                eldivhold.style.overflow = "auto";
                eldivhold.style.paddingBottom = ".5em";

                elspan = document.createElement("span");
                elspan.style.fontSize = "130%";
                elspan.style.cursor = "pointer";
                elspan.style.color = "#900";
                elspan.style.padding = ".1em";
                elspan.style.float = "left";
                elspan.style.display = "inline";
                elspan.id = "i2d-popup-x";
                elspan.innerHTML = '[hide]';
                elspan.style.textDecoration = "underline";
                eldivhold.appendChild(elspan);

                elspan1 = document.createElement("span");
                elspan1.style.fontSize = "130%";
                elspan1.style.cursor = "pointer";
                elspan1.style.color = "#900";
                elspan1.style.padding = ".1em";
                elspan1.style.float = "right";
                //elspan1.style.display = "none";
                elspan1.style.display = "inline";
                elspan1.id = "i2d-popup-close";
                elspan1.innerHTML = '[close]';
                elspan1.style.textDecoration = "underline";
                eldivhold.appendChild(elspan1);

                //el.innerHTML = "<br style='line-height:150%' />";
                el.id = "i2d-popup";
                eldiv = document.createElement("div");
                eldiv.id = "i2d-popup-div";
                //eldiv.style.display = "none";
                eldiv.style.display = "block";
                el.appendChild(eldiv);
                el.insertBefore(eldivhold, el.firstChild);
                document.body.appendChild(el);

                elspan.onclick = function() {
                    /*var el = document.getElementById("i2d-popup");
                      el.parentElement.removeChild(el);*/
                    var eldiv = document.getElementById("i2d-popup-div");
                    var elspan = document.getElementById("i2d-popup-x");
                    if (eldiv.style.display === "none") {
                        elspan.innerHTML = '[hide]';
                        eldiv.style.display = "block";
                        elspan1.style.display = "inline";
                    } else {
                        elspan.innerHTML = '[show]';
                        eldiv.style.display = "none";
                        elspan1.style.display = "none";
                    }
                };

                elspan1.onclick = function() {
                    var el = document.getElementById("i2d-popup");
                    el.parentElement.removeChild(el);
                };
            }
            var shorturl = newurl;
            if (shorturl.length > 100) {
                shorturl = shorturl.substring(0, 99) + "&hellip;";
            }
            eldiv.innerHTML += text + "<a href='" + newurl + "' style='color:blue' title='" + newurl + "'>" + shorturl + "</a><br />";

            // XXX: why is this needed? test: http://playbb.me/embed.php?w=718&h=438&vid=at/nw/flying_witch_-_01.mp4, animeplus.tv
            document.body.removeChild(el);
            el.style.position = "absolute";
            document.body.appendChild(el);

            /*if (document.getElementById("i2d-popup-x"))
                document.getElementById("i2d-popup-x").parentElement.removeChild(document.getElementById("i2d-popup-x"));*/

            /*el.insertBefore(elspan, el.firstChild);
            el.insertBefore(elspan1, el.firstChild);*/
            //el.insertBefore(eldivhold, el.firstChild);
        });
    }


    // Injecting functions
    var get_script_str = function(f) {
        return f.toString().replace(/^function.*{|}$/g, '');
    };

    function add_script(s, el) {
        var script_body = "(function() {\n" + s + "\n})();";
        var myscript = document.createElement('script');
        myscript.className = "i2d";
        myscript.innerHTML = script_body;
        if (el) {
            el.appendChild(myscript);
        } else {
            document.head.appendChild(myscript);
        }
    }

    function inject(variable, newvalue, aliases) {
        if (variable instanceof Array) {
            for (var i = 0; i < variable.length; i++) {
                inject(variable[i], newvalue, aliases);
            }
            return;
        }

        console.log("[i2d] injecting " + variable);
        if (!aliases)
            aliases = [];

        var initobjects = "";
        var subvariable = variable;
        var subindex = 0;
        while (true) {
            var index = subvariable.indexOf(".");
            var breakme = false;
            if (index < 0) {
                index = subvariable.length;
                breakme = true;
            }
            subvariable = subvariable.substr(index + 1);
            subindex += index + 1;
            var subname = variable.substr(0, subindex - 1);
            initobjects += "if (!" + subname + ") {" + subname + " = {};}\n";
            if (breakme)
                break;
        }

        add_script(i2d_show_url.toString() + "\n" +
                   initobjects + "\n" +
                   "if ((window." + variable + " !== undefined) && !(window." + variable + ".INJECTED)) {\n" +
                   "var oldvariable = window." + variable + ";\n" +
                   "var oldvariable_keys = Object.keys(oldvariable);\n" +
                   "window." + variable + " = " + newvalue.toString() + ";\n" +
                   "for (var i = 0; i < oldvariable_keys.length; i++) {\n" +
                   "    window." + variable + "[oldvariable_keys[i]] = oldvariable[oldvariable_keys[i]];\n" +
                   "}\n" +
                   "window." + variable + ".INJECTED = true;\n" +
                   "var aliases = " + JSON.stringify(aliases) + ";\n" +
                   "for (var i = 0; i < aliases.length; i++) {\n" +
                   "    if (aliases[i] in window && window[aliases[i]] == oldvariable)" +
                   "        window[aliases[i]] = window." + variable + "\n" +
                   "}\n" +
                   "}");
    }

    function jquery_plugin_exists(name) {
        if (!("jQuery" in window) ||
            typeof window.jQuery !== "function" ||
            !("fn" in window.jQuery) ||
            !(name in window.jQuery.fn))
            return false;


        return true;
    }

    function inject_jquery_plugin(name, value) {
        if (!jquery_plugin_exists(name) ||
            window.jQuery.fn[name].INJECTED)
            return;

        inject("jQuery.fn." + name, value);
    }

    function inject_url(pattern, func) {
        // https://stackoverflow.com/questions/629671/how-can-i-intercept-xmlhttprequests-from-a-greasemonkey-script
        console.log("[i2d] injecting URL: " + pattern);
        (function(open) {
            window.XMLHttpRequest.prototype.open = function() {
                if (arguments[1] &&
                    arguments[1].match(pattern)) {
                    var url = arguments[1];
                    this.addEventListener("readystatechange", function() {
                        if (this.readyState === 4) {
                            func.bind(this)(url);
                        }
                    });
                }
                open.apply(this, arguments);
            };
        })(window.XMLHttpRequest.prototype.open);
    }

    function i2d_onload(f) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", f);
        } else {
            f();
        }
    }


    // Main code
    function i2d_main(e) {
        if (e) {
            if (!e.tagName || e.tagName.toLowerCase() !== "script")
                return;
            if ((e.className === "i2d")) {
                return;
            }
        }

        if ("soundManager" in window && !window.soundManager.INJECTED) {
            inject("soundManager.createSound", function(arg1, arg2) {
                if (typeof arg1 === "string")
                    i2d_show_url("soundManager", arg2);
                else
                    i2d_show_url("soundManager", arg1.url);

                return oldvariable.apply(this, arguments);
            });
        }

        if ("jwplayer" in window && !window.jwplayer.INJECTED) {
            inject("jwplayer", function() {
                var result = oldvariable.apply(this, arguments);

                var check_sources = function(x) {
                    if (typeof x === "object") {
                        if (x instanceof Array) {
                            for (var i = 0; i < x.length; i++) {
                                check_sources(x[i]);
                            }
                            return;
                        }

                        var label = "";

                        if ("title" in x)
                            label += "[" + x.title + "]";

                        if ("label" in x)
                            label += "[" + x.label + "]";

                        if ("kind" in x)
                            label += "(" + x.kind + ")";

                        if ("streamer" in x) {
                            i2d_show_url("jwplayer", x.streamer, "[stream]" + label);
                        }

                        if ("file" in x) {
                            i2d_show_url("jwplayer", x.file, label);
                        }

                        if ("sources" in x) {
                            check_sources(x.sources);
                        }

                        if ("playlist" in x) {
                            check_sources(x.playlist);
                        }

                        if ("tracks" in x) {
                            check_sources(x.tracks);
                        }
                    } else if (typeof x === "string") {
                        i2d_show_url("jwplayer", x);
                    }
                };

                if ("setup" in result) {
                    var old_jwplayer_setup = result.setup;
                    result.setup = function() {
                        if (typeof arguments[0] === "object") {
                            var x = arguments[0];

                            if ("modes" in x) {
                                for (var i = 0; i < x.modes.length; i++) {
                                    // TODO: support more?
                                    if ("type" in x.modes[i] && x.modes[i].type === "html5") {
                                        if ("config" in x.modes[i] && "file" in x.modes[i].config) {
                                            check_sources(x.modes[i].config);
                                        }
                                    }
                                }
                            }

                            check_sources(x);
                        }

                        return old_jwplayer_setup.apply(this, arguments);
                    };
                }

                if ("load" in result) {
                    var old_jwplayer_load = result.load;
                    result.load = function() {
                        check_sources(arguments[0]);
                        return old_jwplayer_load.apply(this, arguments);
                    };
                }

                if ("on" in result) {
                    result.on('playlistItem', function(item) {
                        check_sources(item.item);
                    });

                    var old_jwplayer_on = result.on;
                    result.on = function() {
                        if (arguments[0] === "adBlock")
                            return;

                        return old_jwplayer_on.apply(this, arguments);
                    };
                }

                return result;
            });
        }

        if ("flowplayer" in window && !window.flowplayer.INJECTED) {
            inject("flowplayer", function() {
                var obj_baseurl = null;
                var els = [];

                function get_url(x) {
                    x = decodeURIComponent(x);

                    if (obj_baseurl) {
                        if (x.match(/^[a-z]*:\/\//)) {
                            return x;
                        } else {
                            return obj_baseurl + "/" + x;
                        }
                    } else {
                        return x;
                    }
                }

                function check_sources(x, els, label) {
                    if (typeof x === "string") {
                        if (!x.match(/\.xml$/))
                            i2d_show_url("flowplayer", get_url(x), label);

                        return;
                    }

                    if (x instanceof Array) {
                        for (var i = 0; i < x.length; i++) {
                            check_sources(x[i], els, label);
                        }
                        return;
                    }

                    if (typeof x !== "object")
                        return;

                    label = "";

                    if ("title" in x)
                        label += "[" + x.title + "]";

                    if ("clip" in x) {
                        if ("baseUrl" in x.clip) {
                            obj_baseurl = x.clip.baseUrl;

                            for (var i = 0; i < els.length; i++) {
                                els[i].i2d_baseurl = obj_baseurl;
                            }
                        }

                        check_sources(x.clip, els, label);
                    }

                    if ("sources" in x) {
                        check_sources(x.sources, els, label);
                    }

                    if ("playlist" in x) {
                        check_sources(x.playlist, els, label);
                    }

                    if ("url" in x) {
                        check_sources(x.url, els, label);
                    }

                    if ("src" in x) {
                        check_sources(x.src, els. label);
                    }

                    if ("bitrates" in x) {
                        for (var j = 0; j < x.bitrates.length; j++) {
                            if ("url" in x.bitrates[j]) {
                                var description = "";
                                if (x.bitrates[j].isDefault)
                                    description += "default:";
                                if (x.bitrates[j].sd)
                                    description += "sd:";
                                if (x.bitrates[j].hd)
                                    description += "hd:";
                                if (x.bitrates[j].bitrate)
                                    description += x.bitrates[j].bitrate;

                                i2d_show_url("flowplayer", get_url(x.bitrates[j].url), description);
                            }
                        }
                    }
                }

                if (arguments.length >= 1) {
                    els = [null];

                    if (typeof arguments[0] === "string") {
                        try {
                            els[0] = document.getElementById(arguments[0]);
                        } catch(e) {
                        }

                        try {
                            if (!els[0])
                                els = document.querySelectorAll(arguments[0]);
                        } catch(e) {
                            els = [];
                        }
                    } else if (arguments[0] instanceof HTMLElement) {
                        els = [arguments[0]];
                    }
                }

                for (var i = 0; i < els.length; i++) {
                    if (!els[i] || !(els[i] instanceof HTMLElement))
                        continue;

                    if ("i2d_baseurl" in els[i])
                        obj_baseurl = els[i].i2d_baseurl;
                }

                if (arguments.length >= 3 && typeof arguments[2] === "object") {
                    check_sources(arguments[2], els);
                } else if (arguments.length >= 3 && typeof arguments[2] === "string") {
                    i2d_show_url("flowplayer", get_url(arguments[2]));
                } else if (arguments.length === 2 && typeof arguments[1] === "object") {
                    check_sources(arguments[1], els);
                } else if (arguments.length === 2 && typeof arguments[1] === "string") {
                    i2d_show_url("flowplayer", get_url(arguments[1]));
                }

                for (var i = 0; i < els.length; i++) {
                    if (!els[i] || !(els[i] instanceof HTMLElement))
                        continue;

                    var href = els[i].getAttribute("href");
                    if (href) {
                        i2d_show_url("flowplayer", get_url(href), "href");
                    }
                }

                var result = oldvariable.apply(this, arguments);

                if (!result || typeof result !== "object")
                    return result;

                if ("addClip" in result) {
                    var old_fplayer_addclip = result.addClip;
                    result.addClip = function() {
                        if (arguments.length > 0)
                            check_sources(arguments[0], els);

                        return old_fplayer_addclip.apply(this, arguments);
                    };
                }

                if ("setPlaylist" in result) {
                    var old_fplayer_setplaylist = result.setPlaylist;
                    result.setPlaylist = function() {
                        if (arguments.length > 0)
                            check_sources(arguments[0], els);

                        return old_fplayer_setplaylist.apply(this, arguments);
                    };
                }

                if ("load" in result) {
                    var old_fplayer_load = result.load;
                    result.load = function() {
                        if (arguments.length > 0)
                            check_sources(arguments[0], els);

                        return old_fplayer_load.apply(this, arguments);
                    };
                }

                /*if ("on" in result) {
                    result.on("load", function(e, api, video) {
                        console.log(e);
                        check_sources(video || api.video, els);
                    });
                }*/

                return result;
            }, ["$f"]);

            add_script(get_script_str(function() {
                flowplayer(function(api, root) {
                    api.on("load", function(e, api, video) {
                        flowplayer().load(video || api.video);
                    });
                });
            }));
        }

        if ("videojs" in window && !window.videojs.INJECTED) {
            inject("videojs", function() {
                if (arguments.length > 0 && typeof arguments[0] === "string") {
                    var my_el = document.getElementById(arguments[0]);
                    if (!my_el)
                        my_el = document.querySelector(arguments[0]);

                    if (my_el) {
                        if (my_el.src) {
                           i2d_show_url("videojs", my_el.src);
                        }

                        for (var i = 0; i < my_el.children.length; i++) {
                            if (my_el.children[i].tagName.toLowerCase() === "source") {
                                if (my_el.children[i].src) {
                                    i2d_show_url("videojs", my_el.children[i].src, my_el.children[i].getAttribute("label"));
                                }
                            }
                        }
                    }
                }

                var result = oldvariable.apply(this, arguments);

                var old_videojs_src = result.src;
                result.src = function() {
                    if (arguments.length > 0 && typeof arguments[0] === "object") {
                        if ("src" in arguments[0]) {
                            i2d_show_url("videojs", arguments[0].src);
                        }
                    }

                    return old_videojs_src.apply(this, arguments);
                };

                return result;
            });

            add_script(i2d_show_url.toString() +
                       i2d_onload.toString() +
                       get_script_str(function() {
                            i2d_onload(function() {
                                var els = document.getElementsByClassName("video-js");
                                for (var i = 0; i < els.length; i++) {
                                    var my_el = els[i];
                                    if (my_el.tagName.toLowerCase() === "video") {
                                        if (!my_el.getAttribute('data-setup')) {
                                            continue;
                                        }
                                        if (my_el.src) {
                                           i2d_show_url("videojs", my_el.src);
                                        }

                                        for (var j = 0; j < my_el.children.length; j++) {
                                            if (my_el.children[j].tagName.toLowerCase() === "source") {
                                                if (my_el.children[j].src) {
                                                    i2d_show_url("videojs", my_el.children[j].src, my_el.children[j].getAttribute("label"));
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                       }));
        }

        if ("amp" in window && !window.amp.INJECTED) {
            inject("amp", function() {
                function show_amp_source(sourceobj) {
                    if ("protectionInfo" in sourceobj) {
                        console.log("[amp] Cannot decode protection info");
                    }
                    if ("src" in sourceobj)
                       i2d_show_url("amp", sourceobj.src);
                }

                if (arguments.length >= 2 && typeof arguments[1] === "object") {
                    if ("sourceList" in arguments[1]) {
                        for (var i = 0; i < arguments[1].sourceList.length; i++) {
                            show_amp_source(arguments[1].sourceList[i]);
                        }
                    }
                }

                var result = oldvariable.apply(this, arguments);

                if (!result)
                    return result;

                var old_amp_src = result.src;
                result.src = function() {
                    for (var i = 0; i < arguments[0].length; i++) {
                        show_amp_source(arguments[0][i]);
                    }

                    return old_amp_src.apply(this, arguments);
                };

                return result;
            });
        }

        if ("DJPlayer" in window && !window.DJPlayer.INJECTED) {
            add_script(i2d_show_url.toString() + "\n" +
                       "var oldsetmedia = window.DJPlayer.prototype.setMedia;\n" +
                       "window.DJPlayer.prototype.setMedia = function() {\n" +
                       "  if (arguments.length > 0 && typeof arguments[0] === 'string') {\n" +
                       "    i2d_show_url('DJPlayer', arguments[0]);\n" +
                       "  }\n" +
                       "  return oldsetmedia.apply(this, arguments);\n" +
                       "}");
        }

        if ("bitmovin" in window && !window.bitmovin.INJECTED) {
            inject(["bitmovin.player", "bitdash", "bitmovinPlayer"], function() {
                var result = oldvariable.apply(this, arguments);

                var check_progressive = function(progressive) {
                    if (typeof progressive === "string") {
                        i2d_show_url("bitmovin", progressive, "progressive");
                    } else if (progressive instanceof Array) {
                        for (var i = 0; i < progressive.length; i++) {
                            check_progressive(progressive[i]);
                        }
                    } else if (typeof progressive === "object") {
                        var str = "";
                        if (progressive.label)
                            str += "[" + progressive.label + "] ";
                        if (progressive.bitrate)
                            str += progressive.bitrate;

                        i2d_show_url("bitmovin", progressive.url, str);
                    }
                };

                var check_sources = function(x) {
                    if (typeof x === "object") {
                        if ("source" in x) {
                            var sourceobj = x.source;

                            if (sourceobj.progressive) {
                                check_progressive(sourceobj.progressive);
                            }

                            if (sourceobj.dash) {
                                i2d_show_url("bitmovin", sourceobj.dash, "dash");
                            }

                            if (sourceobj.hls) {
                                i2d_show_url("bitmovin", sourceobj.hls, "hls");
                            }
                        }
                    }
                };

                if ("setup" in result) {
                    var old_bitmovin_setup = result.setup;
                    result.setup = function() {
                        check_sources(arguments[0]);

                        return old_bitmovin_setup.apply(this, arguments);
                    };
                }

                if ("load" in result) {
                    var old_bitmovin_load = result.load;
                    result.load = function() {
                        check_sources({source: arguments[0]});

                        return old_bitmovin_load.apply(this, arguments);
                    };
                }

                return result;
            });
        }

        if ("dashjs" in window && window.dashjs.MediaPlayer && !window.dashjs.MediaPlayer.INJECTED) {
            inject("dashjs.MediaPlayer", function() {
                var outer_result = oldvariable.apply(this, arguments);

                var oldcreate = outer_result.create;
                outer_result.create = function() {
                    var result = oldcreate.apply(this, arguments);

                    var old_attachsource = result.attachSource;
                    result.attachSource = function(url) {
                        i2d_show_url("dash.js", url);
                        return old_attachsource.apply(this, arguments);
                    };

                    return result;
                };

                return outer_result;
            });
        }

        if ("Hls" in window && window.Hls && !window.Hls.INJECTED) {
            console.log("[i2d] injecting Hls");
            var old_loadsource = window.Hls.prototype.loadSource;
            window.Hls.prototype.loadSource = function(url) {
                i2d_show_url("hls.js", url);
                return old_loadsource.apply(this, arguments);
            };
            window.Hls.INJECTED = true;
        }

        if ("flvjs" in window && window.flvjs.createPlayer && !window.flvjs.createPlayer.INJECTED) {
            inject("flvjs.createPlayer", function(options) {
                if (options) {
                    if ("url" in options) {
                        i2d_show_url("flv.js", options.url);
                    }
                }
                return oldvariable.apply(this, arguments);
            });
        }

        if (("location" in window) && window.location && window.location.host.search("soundcloud.com") >= 0 && !("soundcloud" in injected_set)) {
            injected_set["soundcloud"] = true;

            inject_url(/api\.soundcloud\.com\/.*?\/tracks\/[0-9]*\/streams/, function(url) {
                var track = url.match(/\/tracks\/([0-9]*)\//);
                var parsed = JSON.parse(this.responseText);
                for (var item in parsed) {
                    i2d_show_url("soundcloud", parsed[item], "[" + item + "] " + track[1]);
                }
            });
        }

        if (("location" in window) && window.location && window.location.host.search("forvo") >= 0 && "createAudioObject" in window && !window.createAudioObject.INJECTED) {
            inject("createAudioObject", function(id, mp3, ogg) {
                i2d_show_url("forvo", mp3, "mp3");
                i2d_show_url("forvo", ogg, "ogg");

                return oldvariable.apply(this, arguments);
            });
        }

        if (("location" in window) && window.location && window.location.href.search("twitter.com/i/videos") >= 0 && !("twitter" in injected_set)) {
            injected_set["twitter"] = true;

            i2d_onload(function() {
                var pc = document.getElementById('playerContainer');
                if (!pc) {
                    return;
                }

                var config = pc.getAttribute('data-config');
                if (!config) {
                    return;
                }

                var config_parsed = JSON.parse(config);

                if ("video_url" in config_parsed) {
                    i2d_show_url('twitter', config_parsed.video_url);
                }
            });
        }

        if (("location" in window) && window.location && window.location.href.search("vine.co/v/") >= 0) {
            var show_video_urls = function(videourls) {
                for (var i = 0; i < videourls.length; i++) {
                    var videourl = videourls[i];

                    var formatstr = "[";
                    formatstr += videourl.format + ":";
                    formatstr += videourl.idStr;

                    if (videourl.rate > 0)
                        formatstr += ", " + videourl.rate;

                    formatstr += "]";

                    i2d_show_url('vine', videourl.videoUrl, formatstr);
                }
            };

            if (window.location.href.search("/card" ) >= 0 && !("vine_card" in injected_set)) {
                injected_set["vine_card"] = true;

                i2d_onload(function() {
                    var config_el = document.getElementById("configuration");
                    if (!config_el) {
                        return;
                    }

                    var config = JSON.parse(config_el.innerHTML);
                    if (!config || typeof config !== "object") {
                        return;
                    }

                    if (!("post" in config) || !("videoUrls" in config.post)) {
                        return;
                    }

                    show_video_urls(config.post.videoUrls);
                });
            } else if (!("vine_video" in injected_set)) {
                injected_set["vine_video"] = true;

                i2d_onload(function() {
                    var scripts = document.getElementsByTagName("script");
                    if (scripts.length === 0)
                        return;

                    var thescript = null;
                    for (var i = 0; i < scripts.length; i++) {
                        if (scripts[i].innerHTML.search("window.POST_DATA") < 0) {
                            continue;
                        }

                        thescript = scripts[i];
                        break;
                    }

                    var config;
                    eval(thescript.innerHTML.replace("window.POST_DATA", "config"));

                    var videourls = config[Object.keys(config)[0]].videoUrls;
                    show_video_urls(videourls);
                });
            }
        }

        if ("jQuery" in window) {
            inject_jquery_plugin("jPlayer", function() {
                if (arguments.length > 0 && arguments[0] === "setMedia") {
                    if (arguments.length > 1) {
                        if (typeof arguments[1] === "object") {
                            for (var i in arguments[1]) {
                                if (i === "title" ||
                                    i === "duration" ||
                                    i === "track" /* for now */ ||
                                    i === "artist" ||
                                    i === "free")
                                    continue;

                                i2d_show_url("jPlayer", arguments[1][i], i);
                            }
                        } else if (typeof arguments[1] === "string") {
                            i2d_show_url("jPlayer", arguments[1]);
                        }
                    }
                }

                return oldvariable.apply(this, arguments);
            });

            inject_jquery_plugin("amazingaudioplayer", function() {
                var result = oldvariable.apply(this, arguments);

                function add_source_obj(x) {
                    type = "";
                    if ("type" in x) {
                        type = x.type;
                    }

                    i2d_show_url("amazingaudioplayer", x.src, type);
                }

                function add_source(x) {
                    if (x instanceof Array) {
                        for (var i = 0; i < x.length; i++) {
                            add_source_obj(x[i]);
                        }
                    } else {
                        add_source_obj(x);
                    }
                }

                var audioplayer = jQuery(this).data("object").audioPlayer;
                if (audioplayer.audioItem) {
                    add_source(audioplayer.audioItem.source);
                }

                var oldload = audioplayer.load;
                audioplayer.load = function(item) {
                    if ("source" in item) {
                        add_source(item.source);
                    }

                    return oldload.apply(this, arguments);
                };

                return result;
            });

            if (jquery_plugin_exists("jPlayerAudio") && !window.jQuery.fn.jPlayerAudio.INJECTED) {
                inject_jquery_plugin("jPlayerAudio", function() {
                    return oldvariable.apply(this, arguments);
                });

                add_script(i2d_show_url.toString() + "\n" +
                           "var oldmedia=jQuery.jPlayerAudio.prototype.setMedia;\n" +
                           "jQuery.jPlayerAudio.prototype.setMedia = function(e) {\n" +
                           "  var absolute = this._absoluteMediaUrls(e);\n" +
                           "  jQuery.each(this.formats, function(a, o) {\n" +
                           "    i2d_show_url('cleanaudioplayer', absolute[o]);\n" +
                           "  });\n" +
                           "  return oldmedia.apply(this, arguments);\n" +
                           "}");
            }

            if (jquery_plugin_exists("jPlayerVideo") && !window.jQuery.fn.jPlayerVideo.INJECTED) {
                inject_jquery_plugin("jPlayerVideo", function() {
                    return oldvariable.apply(this, arguments);
                });

                add_script(i2d_show_url.toString() + "\n" +
                           "var oldmedia=jQuery.jPlayerVideo.prototype.setMedia;\n" +
                           "jQuery.jPlayerVideo.prototype.setMedia = function(e) {\n" +
                           "  var absolute = this._absoluteMediaUrls(e);\n" +
                           "  jQuery.each(this.formats, function(a, o) {\n" +
                           "    i2d_show_url('cleanvideoplayer', absolute[o]);\n" +
                           "  });\n" +
                           "  return oldmedia.apply(this, arguments);\n" +
                           "}");
            }
        }
    }

    i2d_main();

    window.addEventListener("afterscriptexecute", function(e) {
        i2d_main(e.target);
    });

    var process_raw_tag = function(el) {
        var basename = "raw ";

        if (el.tagName.toLowerCase() === "video") {
            basename += "video";
        } else {
            basename += "audio";
        }

        if (el.id)
            basename += ": #" + el.id;

        var show_updates = function() {
            if (el.src)
                i2d_show_url(basename, el.src);

            for (var x = 0; x < el.children.length; x++) {
                if (el.children[x].tagName.toLowerCase() !== "source" &&
                    el.children[x].tagName.toLowerCase() !== "track") {
                    continue;
                }

                var type = "";
                if (el.children[x].type)
                    type += "[" + el.children[x].type + "]";

                if (el.children[x].label)
                    type += "[" + el.children[x].label + "]";

                if (el.children[x].srclang)
                    type += "[" + el.children[x].srclang + "]";

                if (el.children[x].kind)
                    type += "(" + el.children[x].kind + ")";

                if (el.children[x].src)
                    i2d_show_url(basename, el.children[x].src, type);
            }
        };

        var observer = new MutationObserver(show_updates);
        observer.observe(el, { attributes: true, childList: true });

        show_updates();
    };

    var process_el = function(el) {
        if (el.nodeName === "SCRIPT") {
            i2d_main(el);
        } else if (el.nodeName === "VIDEO" ||
                   el.nodeName === "AUDIO") {
            process_raw_tag(el);
        }

        if (el.children) {
            for (var i = 0; i < el.children.length; i++) {
                process_el(el.children[i]);
            }
        }
    };

    var script_observer_cb = function(mutations, observer) {
        for (var i = 0; i < mutations.length; i++) {
            if (mutations[i].addedNodes) {
                for (var x = 0; x < mutations[i].addedNodes.length; x++) {
                    var addednode = mutations[i].addedNodes[x];
                    process_el(addednode);
                }
            }
            if (mutations[i].removedNodes) {
                for (var x = 0; x < mutations[i].removedNodes.length; x++) {
                    if (mutations[i].removedNodes[x].nodeName === "SCRIPT")
                        i2d_main(mutations[i].removedNodes[x]);
                }
            }
        }
    };

    var script_observer = new MutationObserver(script_observer_cb);

    script_observer.observe(document, {childList: true, subtree: true});

    i2d_onload(function() {
        var get_raws = function() {
            var audios = [].slice.call(document.getElementsByTagName("audio"));
            var videos = [].slice.call(document.getElementsByTagName("video"));
            var els = Array.prototype.concat(audios, videos);

            for (var i = 0; i < els.length; i++) {
                var basename = "raw ";
                var el = els[i];

                if (el.tagName.toLowerCase() === "video") {
                    basename += "video";
                } else {
                    basename += "audio";
                }

                if (el.id)
                    basename += ": #" + el.id;

                var show_updates = function() {
                    if (el.src)
                        i2d_show_url(basename, el.src);

                    for (var x = 0; x < el.children.length; x++) {
                        if (els[i].children[x].tagName.toLowerCase() !== "source" &&
                            els[i].children[x].tagName.toLowerCase() !== "track") {
                            continue;
                        }

                        var type = "";
                        if (el.children[x].type)
                            type += "[" + el.children[x].type + "]";

                        if (el.children[x].label)
                            type += "[" + el.children[x].label + "]";

                        if (el.children[x].srclang)
                            type += "[" + el.children[x].srclang + "]";

                        if (el.children[x].kind)
                            type += "(" + el.children[x].kind + ")";

                        if (el.children[x].src)
                            i2d_show_url(basename, el.children[x].src, type);
                    }
                };

                var observer = new MutationObserver(show_updates);
                observer.observe(el, { attributes: true, childList: true });

                show_updates();
            }
        };

        //get_raws();

        i2d_main();
    });
})();
