function resolveGalleryImageUrl(directory, file) {
    if (!file) {
        return "";
    }

    if (/^https?:\/\//i.test(file) || file.startsWith("//") || file.startsWith("data:")) {
        return file;
    }

    return `${directory}/${file}`;
}

function resolveGalleryReferenceUrl(basePath, reference) {
    if (!reference) {
        return "";
    }

    if (/^https?:\/\//i.test(reference) || reference.startsWith("//") || reference.startsWith("data:")) {
        return reference;
    }

    const normalizedBasePath = basePath.replace(/\/$/, "");
    return `${normalizedBasePath}/${reference.replace(/^\.?\//, "")}`;
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`JSON request failed with status ${response.status}.`);
    }

    return response.json();
}

async function loadExternalGallery(reference, basePath) {
    const resolvedReference = resolveGalleryReferenceUrl(basePath, reference);
    if (!resolvedReference) {
        return { items: [] };
    }

    const payload = await fetchJson(resolvedReference);
    if (Array.isArray(payload)) {
        return { items: payload };
    }

    if (payload && Array.isArray(payload.items)) {
        return payload;
    }

    if (payload && Array.isArray(payload.groups)) {
        return payload;
    }

    return { items: [] };
}

function normalizeGalleryItems(items) {
    if (!Array.isArray(items)) {
        return [];
    }

    return items.flatMap((item) => {
        if (!item || typeof item !== "object") {
            return [];
        }

        if (Array.isArray(item.items)) {
            return normalizeGalleryItems(item.items);
        }

        const hasGalleryFields = [
            item.file,
            item.name,
            item.description,
            item.supportLink,
            item.support_url,
            item.supportUrl,
            item.link,
            item.source,
        ].some((value) => value !== undefined && value !== null && value !== "");

        return hasGalleryFields ? [item] : [];
    });
}

function getSupportLink(item) {
    if (!item) {
        return null;
    }

    const source = item.supportLink || item.support_url || item.supportUrl || item.link || item.source;
    if (!source) {
        return null;
    }

    const href = typeof source === "string" ? source : (source.href || source.url);
    if (!href) {
        return null;
    }

    const label = typeof source === "string" ? "Support this work" : (source.label || source.text || "Support this work");
    return { href, label };
}

function createSlider(directory, title, items) {
    const normalizedItems = normalizeGalleryItems(items);
    const slider = document.createElement("div");
    slider.className = "gallery-slider";
    slider.setAttribute("aria-label", `${title} gallery`);

    if (normalizedItems.length === 0) {
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
    const supportAnchor = document.createElement("a");
    supportAnchor.className = "gallery-support-link";
    supportAnchor.hidden = true;
    caption.append(itemHeading, itemDescription, supportAnchor);
    featured.append(featuredImage, caption);

    const thumbnails = document.createElement("div");
    thumbnails.className = "gallery-thumbnails";
    thumbnails.setAttribute("role", "tablist");
    thumbnails.setAttribute("aria-label", `${title} artwork thumbnails`);

    const showItem = (index) => {
        const item = normalizedItems[index];
        featuredImage.src = resolveGalleryImageUrl(directory, item.file);
        featuredImage.alt = item.name;
        itemHeading.textContent = item.name;
        itemDescription.textContent = item.description || "";

        const supportLink = getSupportLink(item);
        if (supportLink) {
            supportAnchor.href = supportLink.href;
            supportAnchor.target = "_blank";
            supportAnchor.rel = "noopener noreferrer";
            supportAnchor.textContent = supportLink.label;
            supportAnchor.hidden = false;
        } else {
            supportAnchor.removeAttribute("href");
            supportAnchor.textContent = "";
            supportAnchor.hidden = true;
        }

        thumbnails.querySelectorAll("button").forEach((button, buttonIndex) => {
            const selected = buttonIndex === index;
            button.classList.toggle("is-selected", selected);
            button.setAttribute("aria-selected", String(selected));
        });
    };

    normalizedItems.forEach(({ file, name }, index) => {
        const thumbnail = document.createElement("button");
        thumbnail.className = "gallery-thumbnail";
        thumbnail.type = "button";
        thumbnail.setAttribute("role", "tab");
        thumbnail.setAttribute("aria-label", `Show ${name}`);

        const thumbnailImage = document.createElement("img");
        thumbnailImage.src = resolveGalleryImageUrl(directory, file);
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
    const normalizedItems = normalizeGalleryItems(items);
    const gallery = document.createElement("div");
    gallery.className = "gallery-grid";
    normalizedItems.forEach((item) => {
        const { file, name, description } = item;
        const figure = document.createElement("figure");
        figure.className = "gallery-card";

        const image = document.createElement("img");
        image.src = resolveGalleryImageUrl(directory, file);
        image.alt = name;
        image.loading = "lazy";

        const caption = document.createElement("figcaption");
        const itemHeading = document.createElement("h3");
        itemHeading.textContent = name;
        const itemDescription = document.createElement("p");
        itemDescription.textContent = description || "";

        caption.append(itemHeading, itemDescription);
        const supportLink = getSupportLink(item);
        if (supportLink) {
            const supportAnchor = document.createElement("a");
            supportAnchor.href = supportLink.href;
            supportAnchor.target = "_blank";
            supportAnchor.rel = "noopener noreferrer";
            supportAnchor.className = "gallery-support-link";
            supportAnchor.textContent = supportLink.label;
            caption.appendChild(supportAnchor);
        }

        figure.append(image, caption);
        gallery.appendChild(figure);
    });
    return gallery;
}

function createSubsection(directory, { title, items, description, details, url, linkLabel, layout = "slider" }) {
    const subsection = document.createElement("div");
    subsection.className = "gallery-subsection";

    const heading = document.createElement("h3");
    heading.className = "gallery-subsection-title";
    heading.textContent = title;
    subsection.appendChild(heading);

    if (layout === "text") {
        const summary = document.createElement("p");
        summary.className = "gallery-text-description";
        summary.textContent = description || "";
        subsection.appendChild(summary);

        if (Array.isArray(details) && details.length > 0) {
            const detailList = document.createElement("ul");
            detailList.className = "gallery-text-details";
            details.forEach((detail) => {
                const listItem = document.createElement("li");
                listItem.textContent = detail;
                detailList.appendChild(listItem);
            });
            subsection.appendChild(detailList);
        }

        if (url) {
            const projectLink = document.createElement("a");
            projectLink.className = "text-link gallery-project-link";
            projectLink.href = url;
            projectLink.target = "_blank";
            projectLink.rel = "noopener noreferrer";
            projectLink.textContent = linkLabel || "View project";
            subsection.appendChild(projectLink);
        }
    } else {
        subsection.appendChild(layout === "slider"
            ? createSlider(directory, title, items)
            : createGrid(directory, items));
    }
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

        const resolvedSections = await Promise.all((sections || []).map(async (section) => {
            const reference = section && (section.json || section.itemsFile || section.source);
            if (!reference) {
                return section;
            }

            const externalSection = await loadExternalGallery(reference, "data");
            return {
                ...externalSection,
                ...section,
                items: section.items || externalSection.items || [],
                groups: section.groups || externalSection.groups || [],
            };
        }));

        const content = document.createDocumentFragment();
        for (const sectionData of resolvedSections) {
            const { title, items, groups, layout = "grid" } = sectionData;
            const section = document.createElement("section");
            section.className = "gallery-section";
            section.setAttribute("aria-labelledby", `${directory.replace(/\W/g, "-")}-${title.replace(/\W/g, "-")}`);

            const heading = document.createElement("h2");
            heading.id = section.getAttribute("aria-labelledby");
            heading.textContent = title;
            section.appendChild(heading);

            if (groups && groups.length > 0) {
                const groupContainer = document.createElement("div");
                groupContainer.className = "gallery-subsections";
                const resolvedGroups = await Promise.all((groups || []).map(async (group) => {
                    const groupReference = group && (group.json || group.itemsFile || group.source);
                    if (!groupReference) {
                        return group;
                    }

                    const externalGroup = await loadExternalGallery(groupReference, "data");
                    return {
                        ...externalGroup,
                        ...group,
                        items: group.items || externalGroup.items || [],
                        layout: group.layout || externalGroup.layout || "slider",
                    };
                }));

                resolvedGroups.forEach((group) => {
                    groupContainer.appendChild(createSubsection(directory, group));
                });
                section.appendChild(groupContainer);
            } else {
                section.appendChild(layout === "slider"
                    ? createSlider(directory, title, items || [])
                    : createGrid(directory, items || []));
            }
            content.appendChild(section);
        }

        container.replaceChildren(content);
    } catch (error) {
        console.error("Unable to load gallery data:", error);
        container.innerHTML = "<p class=\"gallery-error\">Gallery content could not be loaded.</p>";
    }
}
