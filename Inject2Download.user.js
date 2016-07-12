// ==UserScript==
// @name         Inject2Download
// @namespace    http://lkubuntu.wordpress.com/
// @version      0.1
// @description  Simple media download script
// @author       Anonymous Meerkat
// @include      *
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    "use strict";

    // Helper functions
    function show_url(namespace, url, description) {
        if (!description)
            description = "";

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

        console.log(text + newurl);

        var el = document.getElementById("i2d-popup");
        if (!el) {
            el = document.createElement("div");
            //el.style.position = "absolute";
            el.style.width = "max(60%, 100em)";
            el.style.height = "max(60%, 100em)";
            el.style.maxWidth = "100%";
            el.style.maxHeight = "100%";
            el.style.background = "white";
            el.style.top = "0px";
            el.style.left = "0px";
            el.style.zIndex = 999999;
            el.style.color = "black";
            el.style.overflow = "scroll";
            el.ondblclick = function() {
                el.parentElement.removeChild(el);
            };
            el.innerHTML = "Double click to close<br />";
            el.id = "i2d-popup";
            document.body.appendChild(el);
        }
        el.innerHTML += text + "<a href='" + newurl + "'>" + newurl + "</a><br />";

        // XXX: why is this needed? test: http://playbb.me/embed.php?w=718&h=438&vid=at/nw/flying_witch_-_01.mp4, animeplus.tv
        document.body.removeChild(el);
        el.style.position = "absolute";
        document.body.appendChild(el);
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

    function inject(variable, newvalue) {
        console.log("[i2d] injecting " + variable);
        add_script(show_url.toString() + "\n" +
                   "if (!(" + variable + ".INJECTED)) {\n" +
                   "var oldvariable = window." + variable + ";\n" +
                   "var oldvariable_keys = Object.keys(oldvariable);\n" +
                   "window." + variable + " = " + newvalue.toString() + ";\n" +
                   "for (var i = 0; i < oldvariable_keys.length; i++) {\n" +
                   "    window." + variable + "[oldvariable_keys[i]] = oldvariable[oldvariable_keys[i]];\n" +
                   "}\n" +
                   "window." + variable + ".INJECTED = true;\n" +
                   "}");
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

        if ("soundManager" in unsafeWindow && !unsafeWindow.soundManager.INJECTED) {
            inject("soundManager.createSound", function(arg1, arg2) {
                if (typeof arg1 === "string")
                    show_url("soundManager", arg2);
                else
                    show_url("soundManager", arg1.url);

                return oldvariable.apply(this, arguments);
            });
        }

        if ("jwplayer" in unsafeWindow && !unsafeWindow.jwplayer.INJECTED) {
            inject("jwplayer", function() {
                var result = oldvariable.apply(this, arguments);

                var old_jwplayer_setup = result.setup;
                result.setup = function() {
                    if (typeof arguments[0] === "object") {
                        var x = arguments[0];
                        if ("file" in x) {
                            show_url("jwplayer", x.file);
                        }
                        if ("streamer" in x) {
                            show_url("jwplayer", x.streamer, "stream");
                        }
                        if ("modes" in x) {
                            for (var i = 0; i < x.modes.length; i++) {
                                // TODO: support more?
                                if ("type" in x.modes[i] && x.modes[i].type === "html5") {
                                    if ("config" in x.modes[i] && "file" in x.modes[i].config) {
                                        show_url("jwplayer", x.modes[i].config.file);
                                    }
                                }
                            }
                        }

                        var check_sources = function(x) {
                            if ("sources" in x) {
                                if (x.sources instanceof Array) {
                                    for (var i = 0; i < x.sources.length; i++) {
                                        if (!("file" in x.sources[i]))
                                            continue;

                                        if ("label" in x.sources[i])
                                            show_url("jwplayer", x.sources[i].file, x.sources[i].label);
                                        else
                                            show_url("jwplayer", x.sources[i].file);
                                    }
                                } else {
                                    if ("file" in x.sources)
                                        show_url("jwplayer", x.sources.file);
                                }
                            }
                        }

                        check_sources(x);
                        if ("playlist" in x && x.playlist instanceof Array) {
                            for (var i = 0; i < x.playlist.length; i++) {
                               check_sources(x.playlist[i]);
                            }
                        }
                    }

                    return old_jwplayer_setup.apply(this, arguments);
                };

                return result;
            });
        }

        if ("flowplayer" in unsafeWindow && !unsafeWindow.flowplayer.INJECTED) {
            inject("flowplayer", function() {
                if (arguments.length >= 3 && typeof arguments[2] === "object") {
                    if ("clip" in arguments[2] && "url" in arguments[2].clip) {
                        show_url("flowplayer", arguments[2].clip.url);
                    }
                    if ("playlist" in arguments[2] && arguments[2].playlist instanceof Array) {
                        for (var i = 0; i < arguments[2].playlist.length; i++) {
                            if ("url" in arguments[2].playlist[i]) {
                                var oururl = arguments[2].playlist[i].url;

                                if (!oururl.match(/\.xml$/))
                                    show_url("flowplayer", oururl);
                            }
                            if ("bitrates" in arguments[2].playlist[i]) {
                                var bitrates = arguments[2].playlist[i].bitrates;
                                for (var j = 0; j < bitrates.length; j++) {
                                    if ("url" in bitrates[j]) {
                                        var description = "";
                                        if (bitrates[j].isDefault)
                                            description += "default:";
                                        if (bitrates[j].sd)
                                            description += "sd:";
                                        if (bitrates[j].hd)
                                            description += "hd:";
                                        if (bitrates[j].bitrate)
                                            description += bitrates[j].bitrate;

                                        show_url("flowplayer", bitrates[j].url, description);
                                    }
                                }
                            }
                        }
                    }
                }

                var result = oldvariable.apply(this, arguments);

                if (!result)
                    return result;

                var old_fplayer_addclip = result.addClip;
                result.addClip = function() {
                    if (arguments.length > 0 && typeof arguments[0] === "object" && "url" in arguments[0])
                      show_url("flowplayer", arguments[0].url);

                    return old_fplayer_addclip.apply(this, arguments);
                };

                return result;
            });
            inject("$f", function() {return flowplayer.apply(this, arguments)});
        }

        if ("videojs" in unsafeWindow && !unsafeWindow.videojs.INJECTED) {
            inject("videojs", function() {
                if (arguments.length > 0 && typeof arguments[0] === "string") {
                    var my_el = document.getElementById(arguments[0]);
                    if (!my_el)
                        my_el = document.querySelector(arguments[0]);

                    if (my_el) {
                        if (my_el.src) {
                           show_url("videojs", my_el.src);
                        }

                        for (var i = 0; i < my_el.children.length; i++) {
                            if (my_el.children[i].tagName.toLowerCase() === "source") {
                                if (my_el.children[i].src) {
                                    show_url("videojs", my_el.children[i].src, my_el.children[i].getAttribute("label"));
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
                            show_url("videojs", arguments[0].src);
                        }
                    }

                    return old_videojs_src.apply(this, arguments);
                };

                return result;
            });

            add_script(show_url.toString() +
                       get_script_str(function() {
                            document.addEventListener("DOMContentLoaded", function() {
                                var els = document.getElementsByClassName("video-js");
                                for (var i = 0; i < els.length; i++) {
                                    var my_el = els[i];
                                    if (my_el.tagName.toLowerCase() === "video") {
                                        if (!my_el.getAttribute('data-setup')) {
                                            continue;
                                        }
                                        if (my_el.src) {
                                           show_url("videojs", my_el.src);
                                        }

                                        for (var i = 0; i < my_el.children.length; i++) {
                                            if (my_el.children[i].tagName.toLowerCase() === "source") {
                                                if (my_el.children[i].src) {
                                                    show_url("videojs", my_el.children[i].src, my_el.children[i].getAttribute("label"));
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                       }));
        }

        if ("amp" in unsafeWindow && !unsafeWindow.amp.INJECTED) {
            inject("amp", function() {
                function show_amp_source(sourceobj) {
                    if ("protectionInfo" in sourceobj) {
                        console.log("[amp] Cannot decode protection info");
                    }
                    if ("src" in sourceobj)
                       show_url("amp", sourceobj.src);
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

        if (window.location.host.search("forvo") >= 0 && "createAudioObject" in unsafeWindow && !unsafeWindow.createAudioObject.INJECTED) {
            inject("createAudioObject", function(id, mp3, ogg) {
                show_url("forvo", mp3, "mp3");
                show_url("forvo", ogg, "ogg");

                return oldvariable.apply(this, arguments);
            });
        }
    }

    i2d_main();

    window.addEventListener("afterscriptexecute", function(e) {
      i2d_main(e.target);
    });
})();