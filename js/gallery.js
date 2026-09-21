function createSlider(directory, title, items) {
    const slider = document.createElement("div");
    slider.className = "gallery-slider";
    slider.setAttribute("aria-label", `${title} gallery`);

    if (items.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "gallery-empty";
        emptyMessage.textContent = "Artwork coming soon.";
        slider.appendChild(emptyMessage);
        return slider;
    }

    const featured = document.createElement("figure");
    featured.className = "gallery-featured";

    const featuredImage = document.createElement("img");
    featuredImage.className = "gallery-featured-image";
    featuredImage.loading = "eager";

    const caption = document.createElement("figcaption");
    const itemHeading = document.createElement("h3");
    const itemDescription = document.createElement("p");
    caption.append(itemHeading, itemDescription);
    featured.append(featuredImage, caption);

    const thumbnails = document.createElement("div");
    thumbnails.className = "gallery-thumbnails";
    thumbnails.setAttribute("role", "tablist");
    thumbnails.setAttribute("aria-label", `${title} artwork thumbnails`);

    const showItem = (index) => {
        const item = items[index];
        featuredImage.src = `${directory}/${item.file}`;
        featuredImage.alt = item.name;
        itemHeading.textContent = item.name;
        itemDescription.textContent = item.description;

        thumbnails.querySelectorAll("button").forEach((button, buttonIndex) => {
            const selected = buttonIndex === index;
            button.classList.toggle("is-selected", selected);
            button.setAttribute("aria-selected", String(selected));
        });
    };

    items.forEach(({ file, name }, index) => {
        const thumbnail = document.createElement("button");
        thumbnail.className = "gallery-thumbnail";
        thumbnail.type = "button";
        thumbnail.setAttribute("role", "tab");
        thumbnail.setAttribute("aria-label", `Show ${name}`);

        const thumbnailImage = document.createElement("img");
        thumbnailImage.src = `${directory}/${file}`;
        thumbnailImage.alt = "";
        thumbnailImage.loading = "lazy";
        thumbnail.appendChild(thumbnailImage);
        thumbnail.addEventListener("click", () => showItem(index));
        thumbnails.appendChild(thumbnail);
    });

    slider.append(featured, thumbnails);
    showItem(0);
    return slider;
}

function createGrid(directory, items) {
    const gallery = document.createElement("div");
    gallery.className = "gallery-grid";
    items.forEach(({ file, name, description }) => {
        const figure = document.createElement("figure");
        figure.className = "gallery-card";

        const image = document.createElement("img");
        image.src = `${directory}/${file}`;
        image.alt = name;
        image.loading = "lazy";

        const caption = document.createElement("figcaption");
        const itemHeading = document.createElement("h3");
        itemHeading.textContent = name;
        const itemDescription = document.createElement("p");
        itemDescription.textContent = description;

        caption.append(itemHeading, itemDescription);
        figure.append(image, caption);
        gallery.appendChild(figure);
    });
    return gallery;
}

function createSubsection(directory, { title, items, layout = "slider" }) {
    const subsection = document.createElement("div");
    subsection.className = "gallery-subsection";

    const heading = document.createElement("h3");
    heading.className = "gallery-subsection-title";
    heading.textContent = title;
    subsection.appendChild(heading);
    subsection.appendChild(layout === "slider"
        ? createSlider(directory, title, items)
        : createGrid(directory, items));
    return subsection;
}

async function BuildGallery(directory) {
    const container = document.getElementById("gallery-content");

    if (!container) {
        console.error("Gallery container was not found.");
        return;
    }

    try {
        const response = await fetch("data/gallery.json");
        if (!response.ok) {
            throw new Error(`Gallery data request failed with status ${response.status}.`);
        }

        const galleries = await response.json();
        const sections = galleries[directory];
        if (!sections) {
            throw new Error(`No gallery is configured for "${directory}".`);
        }

        const content = document.createDocumentFragment();
        sections.forEach(({ title, items, groups, layout = "grid" }) => {
            const section = document.createElement("section");
            section.className = "gallery-section";
            section.setAttribute("aria-labelledby", `${directory.replace(/\W/g, "-")}-${title.replace(/\W/g, "-")}`);

            const heading = document.createElement("h2");
            heading.id = section.getAttribute("aria-labelledby");
            heading.textContent = title;
            section.appendChild(heading);

            if (groups) {
                const groupContainer = document.createElement("div");
                groupContainer.className = "gallery-subsections";
                groups.forEach((group) => {
                    groupContainer.appendChild(createSubsection(directory, group));
                });
                section.appendChild(groupContainer);
            } else {
                section.appendChild(layout === "slider"
                    ? createSlider(directory, title, items)
                    : createGrid(directory, items));
            }
            content.appendChild(section);
        });

        container.replaceChildren(content);
    } catch (error) {
        console.error("Unable to load gallery data:", error);
        container.innerHTML = "<p class=\"gallery-error\">Gallery content could not be loaded.</p>";
    }
}
