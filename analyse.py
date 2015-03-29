#!/usr/bin/python
from lxml import html
from lxml.html import builder as E
import json

doc = html.parse("http://studium.fmi.uni-leipzig.de/stundenplaene/ss2015/s15stdgang.html")
plan = doc.find("//div[@id='stdplan']")

studiengaenge = []
parameter = ["s_termin_typ", "s_termin_von", "s_termin_bis", "s_termin_zeit", "s_termin_raum"]
tabelle = []

for studiengang in plan.findall("div[@class='s_stdgang_titel']"):
    studiengaenge.append(studiengang.find("h4").find("a").find("u").find("b").text)

counter = 0
id = 0
for studiengang in plan.findall("div[@class='s_stdgang']"):
    #print(". ")
    #print("Studiengang: " + studiengaenge[counter])
    for modul in studiengang.find("div").findall("div[@class='s_modul']"):
        modulname = modul.find("table[@class='full border s_modul_head']").find("tr").getchildren()[2].find(".//b").text
        #print("  " + modulname)
        veranstaltungen = modul.find("table[@class='full']")
        for veranstaltung in veranstaltungen.findall("table"):
            classes = veranstaltung.get("class")
            if "s_veranstaltung" in classes.split():
                for text in veranstaltung.findall(".//b"):
                    if text.text:
                        aktuelle_veranstaltung = text.text
                #print("    " + aktuelle_veranstaltung)
            else:
                termin = {}
                for spalte in veranstaltung.findall(".//td"):
                    if spalte.get("class") in parameter:
                        termin[spalte.get("class")] = spalte.text
                    if spalte.get("class") == "s_termin_dozent":
                        termin["s_termin_dozent"] = spalte.find(".//a").text
                try:
                    termin["s_termin_von"] = float(termin["s_termin_von"].replace(":","")) 
                    termin["s_termin_von"] = int(termin["s_termin_von"] / 100) + (termin["s_termin_von"] % 100) / 60
                except:
                    termin["s_termin_von"] = 0
                try:
                    termin["s_termin_bis"] = float(termin["s_termin_bis"].replace(":",""))
                    termin["s_termin_bis"] = int(termin["s_termin_bis"] / 100) + (termin["s_termin_bis"] % 100) / 60
                except:
                    termin["s_termin_bis"] = 0
                    
                if not termin["s_termin_dozent"]:
                    termin["s_termin_dozent"] = "Unbekannt"
                    
                if not termin["s_termin_raum"]:
                    termin["s_termin_raum"] = "Unbekannt"
                
                termin["name"] = aktuelle_veranstaltung
                termin["modul"] = modulname
                termin["studiengang"] = studiengaenge[counter]
                termin["id"] = id
                id += 1
                tabelle.append(termin)
                #if "s_termin_typ" in termin:
                #    print("      " + termin["s_termin_typ"])
                #    print("      " + termin["s_termin_von"] + " - " + termin["s_termin_bis"])
    counter += 1

# Alle Module eingeladen, hoffe ich

htmlfile = E.HTML(
    E.HEAD(
        E.LINK(rel="stylesheet", href="plan.css", type="text/css"),
        E.SCRIPT(src="plan.js", type="text/javascript"),
        E.META(charset="utf-8"),
        E.TITLE("Test")
    ),
    E.BODY(
        E.H1("Stundenplan")
    )
)
document = htmlfile.find("body")

for studiengang in studiengaenge:
    print(studiengang)
    document.append(E.H2(studiengang, name=studiengang))
    container = E.DIV(E.CLASS("plancontainer"))
    #        E.DIV(E.CLASS("plancontainer"))

    for stunde in range(59):
        style = "top: " + str(2 + (100/60)*stunde) + "%; "
        mnt = str(int((stunde+2)%4*15))
        if mnt == "0":
            mnt = "00"
        
        container.append(
            E.DIV(
                E.CLASS("stunde"),
                E.B(str(int(stunde/4+7.5))+":"+mnt),
                style=style
            )
        )


    plan = {}
    wochentagcounter = 0
    for wochentag in ["montags","dienstags","mittwochs","donnerstags","freitags"]:
        plan[wochentag] = []
        print(" "+wochentag)
        
        for veranstaltung in tabelle:
            if veranstaltung["studiengang"] == studiengang and veranstaltung["s_termin_zeit"] == wochentag:
                platziert = False
                for spalte in plan[wochentag]:
                    if platziert == False:
                        spalte_frei = True
                        for spalten_veranstaltung in spalte:
                            if spalten_veranstaltung["s_termin_bis"] > veranstaltung["s_termin_von"] and spalten_veranstaltung["s_termin_von"] < veranstaltung["s_termin_bis"]:
                                spalte_frei = False
                        if spalte_frei:
                            spalte.append(veranstaltung)
                            platziert = True
                            
                if platziert == False:
                    plan[wochentag].append([veranstaltung])

        style = "left: " + str(5 + 19*wochentagcounter) + "%; "
        container.append(
            E.DIV(
                E.CLASS("tag"),
                E.B(wochentag),
                style=style
            )
        )


        width = len(plan[wochentag])
        spaltencounter = 0
        for spalte in plan[wochentag]:
            for veranstaltung in spalte:
                style = ""
                style += "width: " + str(19/width) + "%; "
                style += "min-width: " + str(19/width) + "%; "
                style += "height: " + str((100/15) * (veranstaltung["s_termin_bis"] - veranstaltung["s_termin_von"])) + "%; "
                style += "top: " + str((100/15) * (veranstaltung["s_termin_von"] - 7.5) + 2) + "%; "
                style += "left: " + str((19/width)*spaltencounter + 19*wochentagcounter + 5) + "%; "
                container.append(
                    E.DIV(
                        E.CLASS("veranstaltung " + veranstaltung["s_termin_typ"]),
                        E.B(veranstaltung["name"]),
                        E.BR(),
                        E.I(veranstaltung["modul"]),
                        E.BR(),
                        veranstaltung["s_termin_typ"],
                        E.DIV(
                            E.CLASS("bottom"),
                            veranstaltung["s_termin_dozent"],
                            E.BR(),
                            veranstaltung["s_termin_raum"]
                        ),
                        style=style
                    )
                )
            spaltencounter += 1
        wochentagcounter += 1
         
    document.append(container)

with open("modules.json", "w") as f:
    json.dump(tabelle, f, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)
    
#html.open_in_browser(htmlfile, encoding="utf-8")
#    tostring(doc, pretty_print=False, include_meta_content_type=False, encoding=None, method='html', with_tail=True, doctype=None)
