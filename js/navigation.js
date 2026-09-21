function include(html = String, id = String, errorName = String)
{
    fetch(html)
    .then(res => res.text())
    .then(data => {
        let oldElem = document.querySelector("script#"+id);
        if (!oldElem) {
            return;
        }

        let newElem = document.createElement("div");
        newElem.innerHTML = data;

        oldElem.parentNode.replaceChild(newElem, oldElem);
    })
    .catch(err => console.error("Error loading" + errorName + ":", err));
}

include('includes/navigation.html', 'navigation_bar', 'navbar')
include('includes/footer.html', 'footer', 'footer')