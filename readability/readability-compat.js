// Based on the original Arc90 init function to provide style compatibility
function init () {
    var uri = {
        spec: location.href,
        host: location.host,
        prePath: location.origin,
        scheme: location.protocol.substring(0, location.protocol.length -1),
        pathBase: location.href.substring(0, location.href.lastIndexOf('/') + 1)
    };
    var readability = new Readability(uri, document.cloneNode(true));
    var article = readability.parse();

    /* Build readability's DOM tree */
    var overlay        = document.createElement("DIV");
    var innerDiv       = document.createElement("DIV");
    articleTitle       = document.createElement("H1");
    articleTitle.innerHTML = article.title;
    articleContent    = document.createElement("DIV");
    articleContent.id = "readability-content";
    articleContent.innerHTML = article.content;


    overlay.id              = "readOverlay";
    innerDiv.id             = "readInner";

    /* Apply user-selected styling */
    document.body.className = readStyle;
    document.dir            = article.dir;

    if (readStyle === "style-athelas" || readStyle === "style-apertura"){
        overlay.className = readStyle + " rdbTypekit";
    }
    else {
        overlay.className = readStyle;
    }
    innerDiv.className    = readMargin + " " + readSize;

    if(typeof(readConvertLinksToFootnotes) !== 'undefined' && readConvertLinksToFootnotes === true) {
        readability.convertLinksToFootnotes = true;
    }

    /* Glue the structure of our document together. */
    innerDiv.appendChild( articleTitle   );
    innerDiv.appendChild( articleContent );
    overlay.appendChild( innerDiv       );

    /* Clear the old HTML, insert the new content. */
    document.body.innerHTML = "";
    document.body.insertBefore(overlay, document.body.firstChild);
    document.body.removeAttribute('style');

    if(readability.frameHack)
    {
        var readOverlay = document.getElementById('readOverlay');
        readOverlay.style.height = '100%';
        readOverlay.style.overflow = 'auto';
    }

    /**
     * If someone tries to use Readability on a site's root page, give them a warning about usage.
     **/
    if((window.location.protocol + "//" + window.location.host + "/") === window.location.href)
    {
        articleContent.style.display = "none";
        var rootWarning = document.createElement('p');
        rootWarning.id = "readability-warning";
        rootWarning.innerHTML = "<em>Readability</em> was intended for use on individual articles and not home pages. " +
            "If you'd like to try rendering this page anyway, <a onClick='javascript:document.getElementById(\"readability-warning\").style.display=\"none\";document.getElementById(\"readability-content\").style.display=\"block\";'>click here</a> to continue.";

        innerDiv.insertBefore( rootWarning, articleContent );
    }

    /* Remove all stylesheets */
    for (var k=0;k < document.styleSheets.length; k+=1) {
        if (document.styleSheets[k].href !== null && document.styleSheets[k].href.lastIndexOf("readability") === -1) {
            document.styleSheets[k].disabled = true;
        }
    }

    window.scrollTo(0, 0);

    /* If we're using the Typekit library, select the font */
    if (readStyle === "style-athelas" || readStyle === "style-apertura") {
        readability.useRdbTypekit();
    }
}

init();