function includeHTML()
{
    var elements = document.getElementsByClassName("include");
    for (var i = 0; i < elements.length; i++)
    {
        var element = elements[i];
        var file = element.getAttribute("include-html");
        if (file)
        {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function ()
            {
                if (this.readyState == 4)
                {
                    if (this.status == 200) { element.innerHTML = this.responseText; }
                    if (this.status == 404) { element.innerHTML = "Page not Found"; }
                    element.removeAttribute("include-html");
                    includeHTML();
                }

                console.log("Ready");
            }
        }

        
        xhttp.open("GET", file, true);
        xhttp.send();

        console.log("Sent");

        return;
    }
}