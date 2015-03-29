var days = ["montags","dienstags","mittwochs","donnerstags","freitags"];
var plan = {};

var modules = [];

/**
 * collapse or expand div
 * @param event
 */
function toggleActive(event) {
    var div = event.target;

    if ( div.className.match(/(?:^|\s)active(?!\S)/) ) // I wish I just had used JQuery
    {
        div.className = div.className.replace( /(?:^|\s)active(?!\S)/g , '')
        modules[div.id.replace("module","")]["active"] = false;
    }
    else
    {
        div.className += " active";
        modules[div.id.replace("module","")]["active"] = true;
    }

    clearDays(document.getElementById("mainview"));
    render();
}

/**
 * collapse or expand div
 * @param event
 */
function flip(event) {
    var div = event.target;

    if ( div.className.match(/(?:^|\s)collapsed(?!\S)/) ) // I wish I just had used JQuery
    {
        div.className = div.className.replace( /(?:^|\s)collapsed(?!\S)/g , '')
    }
    else
    {
        div.className += " collapsed";
    }
}

/**
 * create a tree to choose modules
 */
function createTree(dom)
{
    var dom = document.getElementById("sideboard");

    var tree = {};

    for (var module = 0; module <modules.length; module++)
    {
        var m_studgang = modules[module]["studiengang"];
        var m_modul = modules[module]["modul"];

        if (!tree.hasOwnProperty(m_studgang))
        {
            tree[m_studgang] = [];
        }

        if (!tree[m_studgang].hasOwnProperty(m_modul))
        {
            tree[m_studgang][m_modul] = [];
        }

        tree[m_studgang][m_modul] = modules[module];
    }

    for (var studgang in tree)
    {
        var sgDiv = document.createElement("div");
        sgDiv.className = "tree studgang collapsed";
        sgDiv.textContent = studgang;
        sgDiv.addEventListener("click", flip);

        for (var module in tree[studgang])
        {
            var mdDiv = document.createElement("div");
            mdDiv.className = "tree modul";
            mdDiv.textContent = tree[studgang][module]["name"];
            mdDiv.id = "module"+tree[studgang][module]["id"];
            mdDiv.addEventListener("click", toggleActive);

            sgDiv.appendChild(mdDiv);
        }

        dom.appendChild(sgDiv);
    }
}

/**
 * remove all modules from plan
 * @param dom
 */
function clearDays(dom)
{
    while (dom.firstChild) {
        dom.removeChild(dom.firstChild);
    }
    createSkeleton(dom);
}

/**
 * place all modules for a given day onto the plan
 * @param dom
 * @param dayNr
 */
function renderDay(dom, dayNr)
{
    var day = days[dayNr];
    var width = plan[day].length;
    for (var row = 0; row < width; row++)
    {
        for (var module = 0; module < plan[day][row].length; module++)
        {
            var moduleDiv = document.createElement("div");
            moduleDiv.className = "module " + plan[day][row][module]["s_termin_typ"];
            moduleDiv.style.width = (19/width) + "%";
            moduleDiv.style.minWidth = (19/width) + "%";
            moduleDiv.style.height = ((100/15) * (plan[day][row][module]["s_termin_bis"] - plan[day][row][module]["s_termin_von"])) + "%";
            moduleDiv.style.top = ((100/15) * (plan[day][row][module]["s_termin_von"] - 7.5) + 2) + "%";
            moduleDiv.style.left = ((19/width) * row + 19*dayNr + 5) + "%";

            var nameTag = document.createElement("b");
            nameTag.textContent = plan[day][row][module]["name"];
            moduleDiv.appendChild(nameTag);

            moduleDiv.appendChild(document.createElement("br"));

            var moduleTag = document.createElement("i");
            moduleTag.textContent = plan[day][row][module]["modul"];
            moduleDiv.appendChild(moduleTag);

            moduleDiv.appendChild(document.createElement("br"));

            moduleDiv.appendChild(document.createTextNode(plan[day][row][module]["s_termin_typ"]));

            var bottomDiv = document.createElement("div");
            bottomDiv.className = "bottom";

            bottomDiv.appendChild(document.createTextNode(plan[day][row][module]["s_termin_dozent"]));

            bottomDiv.appendChild(document.createElement("br"));

            bottomDiv.appendChild(document.createTextNode(plan[day][row][module]["s_termin_raum"]));

            moduleDiv.appendChild(bottomDiv);

            dom.appendChild(moduleDiv);
        }
    }
}

/**
 * Take all active modules for a given day and put them into rows
 * @param dayNr day of week
 */
function collisionAvoidance(dayNr)
{
    var day = days[dayNr];
    plan[day] = [];

    for (var module = 0; module <modules.length; module++)
    {
        if (modules[module]["s_termin_zeit"] == day && modules[module]["active"]) // TODO: && active
        {
            var placed = false;
            for (var row = 0; row < plan[day].length; row++)
            {
                if (placed == false)
                {
                    var row_free = true;
                    for (var row_module = 0; row_module < plan[day][row].length; row_module++)
                    {
                        if (
                            (plan[day][row][row_module]["s_termin_bis"] > modules[module]["s_termin_von"])
                            && (plan[day][row][row_module]["s_termin_von"] < modules[module]["s_termin_bis"]))
                        {
                            row_free = false;
                        }
                    }
                    if (row_free)
                    {
                        plan[day][row].push(modules[module]);
                        placed = true;
                    }
                }
            }
            if (!placed)
            {
                plan[day].push([modules[module]]);
            }
        }
    }
}

/**
 * generate some skeleton for the days
 * @param dom
 */
function generateDayRows(dom)
{
    var day;

    for (var d = 0; d < days.length; d++)
    {
        day = document.createElement("div");
        day.className = "day";
        day.style.left = (5 + 19*d) + "%";
        day.textContent = days[d];

        dom.appendChild(day);
    }
}

/**
 * Creates lines for the times
 * @param dom DOM node to create hours in
 */
function generateHourLines(dom)
{
    var hour;
    var minute;

    for (var h = 0; h < 59; h++)
    {
        hour = document.createElement("div");
        hour.className = "hour";
        hour.style.top = (2 + (100/60)*h) + "%";

        minute = (h + 2) % 4 * 15;
        if (minute == 0) minute = "00";
        hour.textContent = Math.floor(h/4+7.5) + ":" + minute;


        dom.appendChild(hour);
    }
}

/**
 * create a schedule skeleton in a dom node
 */
function createSkeleton(dom)
{
    generateHourLines(dom);
    generateDayRows(dom);
}

/**
 * Load the modules from a given json file
 * @param file json file on server
 */
function getModules(file) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.onerror = function() {
        console.log("aborted");
    };
    xobj.onreadystatechange = function() {
        if (xobj.readyState == 4 && xobj.status == "200") {
            modules = JSON.parse(xobj.responseText);
            createTree();
            render();
        }
    };
    xobj.open("GET", file, true);
    xobj.send(null);
}

/**
 * Initial function
 * @param event
 */
function init(event) {
    var dom = document.getElementById("mainview");
    createSkeleton(dom);
    getModules("modules.json");
}

/**
 * render plan
 */
function render()
{
    var dom = document.getElementById("mainview");

    for (var d = 0; d < days.length; d++)
    {
        collisionAvoidance(d);
        renderDay(dom, d);
    }
}

document.addEventListener("DOMContentLoaded", init);