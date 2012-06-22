require('./_helper.js');

describe('templating module', function() {
    var logger = raptor.require('logging').logger('raptor-templating-spec'),
        compileAndLoad = helpers.templating.compileAndLoad,
        compileAndRender = helpers.templating.compileAndRender;
        
    before(function() {
        createRaptor();
    });
    
    it("should allow expressions to be parsed", function() {
        var ExpressionParser = raptor.require('templating.compiler.ExpressionParser');
        
        var parts = [],
            parseCallback = {
                text: function(text) {
                    parts.push({text: text});
                },
                
                expression: function(expression) {
                    parts.push({expression: expression.toString()});
                }
            },
            getText = function(i) {
                if (i < parts.length) {
                    if (parts[i].hasOwnProperty('text')) {
                        return parts[i].text || "(EMPTY)";
                    }
                    else {
                        return parts[i].expression + " (EXPRESSION)";
                    }
                }
                else {
                    return null;
                }
                
            },
            getExpression = function(i) {
                if (i < parts.length) {
                    if (parts[i].hasOwnProperty('expression')) {
                        return parts[i].expression || "(EMPTY)";
                    }
                    else {
                        return parts[i].text + " (TEXT)";
                    }
                }
                else {
                    return undefined;
                }
                
            },
            parse = function(str) {
                parts = [];
                ExpressionParser.parse(str, parseCallback);
                //console.log("Parse Result.\nInput: ", str, "\nOutput:\n", parts);
            };
            
        
        parse("hello ${a} world");
        expect(parts.length).toEqual(3);
        expect(getText(0)).toEqual("hello ");
        expect(getExpression(1)).toEqual("a");
        expect(getText(2)).toEqual(" world");
        
        parse("hello {a} world"); //NOTE: The actual string will be "hello \{a} world" since the escape had to be escaped
        expect(parts.length).toEqual(1);
        expect(getText(0)).toEqual("hello {a} world");
        
        parse("hello \\${a} world"); //NOTE: The actual string will be "hello \{a} world" since the escape had to be escaped
        expect(parts.length).toEqual(1);
        expect(getText(0)).toEqual("hello ${a} world");
        
        parse("hello world");
        expect(parts.length).toEqual(1);
        expect(getText(0)).toEqual("hello world");
        
        parse("hello ${'{a}'} world");
        expect(parts.length).toEqual(3);
        expect(getText(0)).toEqual("hello ");
        expect(getExpression(1)).toEqual("'{a}'");
        expect(getText(2)).toEqual(" world");
        
        parse('hello ${"{a}"} world');
        expect(parts.length).toEqual(3);
        expect(getText(0)).toEqual("hello ");
        expect(getExpression(1)).toEqual('"{a}"');
        expect(getText(2)).toEqual(" world");

        parse('$a');
        expect(parts.length).toEqual(1);
        expect(getExpression(0)).toEqual('a');
        
        parse('\\$a');
        expect(parts.length).toEqual(1);
        expect(getText(0)).toEqual('$a');
        
        parse('${a}');
        expect(parts.length).toEqual(1);
        expect(getExpression(0)).toEqual('a');
        
        parse('${a} ${b}');
        expect(parts.length).toEqual(3);
        expect(getExpression(0)).toEqual('a');
        expect(getText(1)).toEqual(" ");
        expect(getExpression(2)).toEqual('b');
        
        parse('${a} ${b}');
        expect(parts.length).toEqual(3);
        expect(getExpression(0)).toEqual('a');
        expect(getText(1)).toEqual(" ");
        expect(getExpression(2)).toEqual('b');
        
        parse('\\\\{1}');
        expect(parts.length).toEqual(1);
        expect(getText(0)).toEqual("\\\\{1}");
        
        parse('\\\\${1}');
        expect(parts.length).toEqual(2);
        expect(getText(0)).toEqual("\\");
        expect(getExpression(1)).toEqual('1');
        
        parse('${{}}');
        expect(parts.length).toEqual(1);
        expect(getExpression(0)).toEqual("{}");

        parse("${entity:lt}DIV${entity:gt}\n    ${startTag:div}Hello${endTag:div}");
        expect(parts.length).toEqual(1);
        expect(getText(0)).toEqual('&lt;DIV&gt;\n    <div>Hello</div>');
        
        parse('AAAA \\${1} BBBB \\\\${1} CCCC \\${1} DDDD \\\\${1}');
        expect(parts.length).toEqual(4);
        expect(getText(0)).toEqual("AAAA ${1} BBBB \\");
        expect(getExpression(1)).toEqual("1");
        expect(getText(2)).toEqual(" CCCC ${1} DDDD \\");
        expect(getExpression(3)).toEqual("1");
        
        
        parse('A \\\\${1} C');
        //expect(parts.length).toEqual(1);
        expect(getText(0)).toEqual("A \\");
        expect(getExpression(1)).toEqual("1");
        expect(getText(2)).toEqual(" C");
        
        
        parse('A \\${1} \\\\${1} C');
        //expect(parts.length).toEqual(1);
        expect(getText(0)).toEqual("A ${1} \\");
        expect(getExpression(1)).toEqual("1");
        expect(getText(2)).toEqual(" C");
        
        parse('C \\${1}');
        expect(getText(0)).toEqual("C ${1}");
        
        
        
//        parse('\\\\{1}');
//        expect(parts.length).toEqual(1);
//        expect(getText(0)).toEqual("\{1}");
        
    });
    
    it("should allow for attribute splitting", function() {
        var AttributeSplitter = raptor.require('templating.compiler.AttributeSplitter');
        var result;
        
        result = AttributeSplitter.parse(
            "item in ['one', 'two', 'three']; separator=', '; varStatus=loop;  ", 
            {
                each: {
                    type: "custom"
                },
                separator: {
                    type: "expression"
                },
                varStatus: {
                    type: "custom"
                }
            },
            {
                defaultName: "each"
            });
        
        expect(raptor.keys(result).length).toEqual(3);
        expect(result["each"]).toEqual("item in ['one', 'two', 'three']");
        expect(result["separator"].getExpression()).toEqual("', '");
        expect(result["varStatus"]).toEqual("loop");
        
        //////
        result = AttributeSplitter.parse(
            "item in ['one', 'two', 'three']", 
            {
                each: {
                    type: "custom"
                },
                
                separator: {
                    type: "expression"
                }
            },
            {
                defaultName: "each"
            });
        
        expect(raptor.keys(result).length).toEqual(1);
        expect(result["each"]).toEqual("item in ['one', 'two', 'three']");
        
        //////
        result = AttributeSplitter.parse(
            "each=item in ['one', 'two', 'three']", 
            {
                each: {
                    type: "custom"
                },
                separator: {
                    type: "expression"
                }
            },
            {
                defaultName: "each"
            });
        
        expect(raptor.keys(result).length).toEqual(1);
        expect(result["each"]).toEqual("item in ['one', 'two', 'three']");
        
        //////
        result = AttributeSplitter.parse(
            "each=item in (a = [1,2,3])", 
            {
                each: {
                    type: "custom"
                },
                separator: {
                    type: "expression"
                }
            },
            {
                defaultName: "each"
            });
        
        expect(raptor.keys(result).length).toEqual(1);
        expect(result["each"]).toEqual("item in (a = [1,2,3])");
    });
    
    it("should allow for escaping XML", function() {
        var escapeXml = raptor.require("xml.utils").escapeXml;
        expect(escapeXml('"-&')).toEqual('&quot;-&amp;');
    });
    
    it("should allow a simple template to be compiled", function() {
        var output = compileAndRender("/test-templates/simple.rhtml", {message: "Hello World!", rootClass: "title", colors: ["red", "green", "blue"]});
        expect(output).toEqual('<div class="hello-world title">Hello World!</div><ul><li class="color">red</li><li class="color">green</li><li class="color">blue</li></ul>');
    });
    
    
    it("should allow for simple template handlers", function() {
        var output = compileAndRender("/test-templates/simple-handlers.rhtml", {dynamic: "universe"});
        expect(output).toEqual('<ul><li>Hello world! adult=false</li><li>Hello universe! adult=true</li><li>Hello Dynamic: universe! adult=false</li></ul>');
    });
    
    it("should allow for template handlers with nested body content", function() {
        var output = compileAndRender("/test-templates/nested-handlers.rhtml", {showConditionalTab: false});
        expect(output).toEqual('<div class="tabs"><ul class="nav nav-tabs"><li class="active"><a href="#tab0" data-toggle="tab">Tab 1</a></li><li class=""><a href="#tab1" data-toggle="tab">Tab 2</a></li></ul><div class="tab-content"><div id="tab0" class="tab-pane active">Tab 1 content</div><div id="tab1" class="tab-pane">Tab 2 content</div></div></div>');
    });

    it("should allow entity expressions", function() {
        var output = compileAndRender("/test-templates/entities.rhtml", {});
        expect(output).toEqual('&lt;DIV&gt; <div>Hello</div><div data-entities="&amp;lt;"></div>');
    });
    
    it("should allow escaped expressions", function() {
        var output = compileAndRender("/test-templates/escaped.rhtml", {});
        expect(output).toEqual('VV {1} XX \\{1} YY ${1} ZZ \\1');
    });
    
    it("should allow complex expressions", function() {
        var output = compileAndRender("/test-templates/expressions.rhtml", {});
        expect(output).toEqual('Hello World!');
    });
    
    it("should allow whitespace to be removed", function() {
        var output = compileAndRender("/test-templates/whitespace.rhtml", {});
        expect(output).toEqual("BEGIN  this whitespace   should be retained   END test hello Long paragraph of text should retain spacing between lines.<ul><li>One</li><li>Two</li></ul><a href=\"Test\">Hello World!</a><pre>\n   begin      end     \n</pre><div>\n   begin      end     \n</div>begin end");
    });
    
    it("should allow HTML output that is not well-formed XML", function() {
        var output = compileAndRender("/test-templates/html.rhtml", {});
        expect(output).toEqual('<img src="test.jpg"><div class="self-closing-not-allowed"></div><script src="test.js"></script><br>');
    });
    
    it("should allow for looping", function() {
        var output = compileAndRender("/test-templates/looping.rhtml", {});
        expect(output).toEqual('abca - true - false - 0 - 3, b - false - false - 1 - 3, c - false - true - 2 - 3<div>red - true - false - 0 - 3</div>, <div>green - false - false - 1 - 3</div>, <div>blue - false - true - 2 - 3</div>');
    });
    
    it("should allow for dynamic attributes", function() {
        var output = compileAndRender("/test-templates/attrs.rhtml", {"myAttrs": {style: "background-color: #FF0000; <test>", "class": "my-div"}});
        expect(output).toEqual('<div data-encoding="&quot;hello&quot;" style="background-color: #FF0000; &lt;test&gt;" class="my-div">Hello World!</div>');
    });
    
    it("should allow for choose...when statements", function() {
        var output = compileAndRender("/test-templates/choose-when.rhtml", {});
        expect(output).toEqual('TRUE,TRUE');
    });
    
    it("should not allow text as a child of a <c:choose> tag", function() {
        
        var e;
        try
        {
            compileAndRender("/test-templates/choose-when-invalid-text.rhtml", {}, true /* invalid */);
        }
        catch(_e) {
            e = _e;
        }
        
        expect(e).toNotEqual(null);
        expect(e.toString().indexOf("INVALID TEXT")).toNotEqual(-1);
    });
    
    it("should not allow <c:otherwise> as only child of <c:choose> tag", function() {
        
        var e;
        try
        {
            compileAndRender("/test-templates/choose-when-invalid-otherwise-only.rhtml", {}, true /* invalid */);
        }
        catch(_e) {
            e = _e;
        }
        
        expect(e).toNotEqual(null);
    });
    
    it("should not allow <c:otherwise> to be before a <c:when> tag", function() {
        
        var e;
        try
        {
            compileAndRender("/test-templates/choose-when-invalid-otherwise-not-last.rhtml", {}, true /* invalid */);
        }
        catch(_e) {
            e = _e;
        }
        
        expect(e).toNotEqual(null);
    });
    
    it("should allow for <c:def> functions", function() {
        var output = compileAndRender("/test-templates/def.rhtml", {});
        expect(output).toEqual('<p class="greeting">Hello, World!</p>,<p class="greeting">Hello, Frank!</p>');
    });
    
    it("should allow for <c:with> functions", function() {
        var output = compileAndRender("/test-templates/with.rhtml", {});
        expect(output).toEqual('1 7 11');
    });
    
    it("should allow for scriptlets", function() {
        var output = compileAndRender("/test-templates/scriptlet.rhtml", {});
        expect(output).toEqual('HELLO,');
    });
    
    it("should allow for when and otherwise as attributes", function() {
        var output = compileAndRender("/test-templates/choose-when-attributes.rhtml", {});
        expect(output).toEqual('<div id="one"><div>TRUE</div></div>,<div id="two"><div>TRUE</div></div>');
    });
    
    it("should allow for elements to be stripped out at compile time", function() {
        var output = compileAndRender("/test-templates/strip.rhtml", {});
        expect(output).toEqual('<div><b>A</b></div><div><span><b>B</b></span></div><div><b>c</b></div><div><span><b>d</b></span></div>');
    });
    
    it("should allow for body content to be replaced with the result of an expression", function() {
        var output = compileAndRender("/test-templates/content.rhtml", {});
        expect(output).toEqual('<div>Hello</div>');
    });
    
    it("should allow for an element to be replaced with the result of an expression", function() {
        var output = compileAndRender("/test-templates/replace.rhtml", {message: "Hello World!"});
        expect(output).toEqual('Hello,Hello World!');
    });
    
    it("should allow for includes", function() {
        var output = compileAndRender("/test-templates/include.rhtml", {});
        expect(output).toEqual('Hello Frank! You have 20 new messages.');
    });
    
    it("should allow for <c:invoke function... />", function() {
        compileAndLoad("/test-templates/invoke.rhtml");
        
        var output = compileAndRender("/test-templates/invoke.rhtml", {});
        expect(output).toEqual('A<p>Hello World!</p>B<p>Hello Frank! You have 10 new messages.</p>');
    });
    
    it("should allow for helper functions", function() {
        
        var helperThisObj = {},
            actualHelperThisObj;
        
        raptor.require('templating').registerFunctions(
            "http://raptor.ebayopensource.org/test",
            "test",
            {
                "trim": function(str) {
                    actualHelperThisObj = this;
                    return str ? raptor.require("strings").trim(str) : str;
                },
                "upperCase": function(str) {
                    return str ? str.toUpperCase(str) : str;
                }
            }, helperThisObj);
        
        var output = compileAndRender("/test-templates/helper-functions-shortname.rhtml", {});
        expect(output).toEqual('Hello WORLD! Hello World!');
        expect(actualHelperThisObj).toStrictlyEqual(helperThisObj);
        
        output = compileAndRender("/test-templates/helper-functions-uri.rhtml", {});
        expect(output).toEqual('Hello WORLD! Hello World!');
        expect(actualHelperThisObj).toStrictlyEqual(helperThisObj);
    });
    
    it("should allow for context helper functions", function() {

        raptor.require('templating').registerFunctions(
            "http://raptor.ebayopensource.org/test",
            "test",
            {
                "user": function(str) {
                    return this.attributes["loggedInUser"];
                },
                "isLoggedIn": function() {
                    return this.attributes["loggedInUser"] != null; 
                }
            });
        
        var context = raptor.require('templating').createContext();
        context.attributes["loggedInUser"] = {
                firstName: "John",
                lastName: "Doe"
        };
        
        var output = compileAndRender("/test-templates/context-helper-functions-shortname.rhtml", {}, false, context);
        expect(output).toEqual('Hello John Doe!');
        
        output = compileAndRender("/test-templates/context-helper-functions-uri.rhtml", {}, false, context);
        expect(output).toEqual('Hello John Doe!');
        
    });
    
    it("should allow for template imports", function() {
        var output = compileAndRender("/test-templates/imports1.rhtml", {showConditionalTab: false});
        expect(output).toEqual('<div class="tabs"><ul class="nav nav-tabs"><li class="active"><a href="#tab0" data-toggle="tab">Tab 1</a></li><li class=""><a href="#tab1" data-toggle="tab">Tab 2</a></li></ul><div class="tab-content"><div id="tab0" class="tab-pane active">Tab 1 content</div><div id="tab1" class="tab-pane">Tab 2 content</div></div></div>');
    });

    it("should allow for template simple imports", function() {
        var output = compileAndRender("/test-templates/imports2.rhtml", {showConditionalTab: false});
        expect(output).toEqual('<div class="tabs"><ul class="nav nav-tabs"><li class="active"><a href="#tab0" data-toggle="tab">Tab 1</a></li><li class=""><a href="#tab1" data-toggle="tab">Tab 2</a></li></ul><div class="tab-content"><div id="tab0" class="tab-pane active">Tab 1 content</div><div id="tab1" class="tab-pane">Tab 2 content</div></div></div>');
    });
    
    it("should allow for context helper functions", function() {

        raptor.require('templating').registerFunctions(
            "http://raptor.ebayopensource.org/test",
            "test",
            {
                "user": function(str) {
                    return this.attributes["loggedInUser"];
                },
                "isLoggedIn": function() {
                    return this.attributes["loggedInUser"] != null; 
                }
            });
        
        var context = raptor.require('templating').createContext();
        context.attributes["loggedInUser"] = {
                firstName: "John",
                lastName: "Doe"
        };
        
        var output = compileAndRender("/test-templates/imports3.rhtml", {}, false, context);
        expect(output).toEqual('Hello John Doe!');
        
    });
    
    xit("should allow for widgets", function() {
        compileAndLoad("/test-templates/widgets_nested.rhtml");
        
        var output = compileAndRender("/test-templates/widgets.rhtml", "widgets", {});
        expect(output).toEqual('<div id="one"><div>TRUE</div></div>,<div id="two"><div>TRUE</div></div>');
    });
});