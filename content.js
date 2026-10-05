/*
    ============================================
    BLACKBOARD CUSTOMIZER
    ============================================
*/

console.log("Blackboard Customizer loaded");

/*
    --------------------------------------------
    APPLY GLOBAL THEME
    --------------------------------------------
*/

async function applyTheme() {
  const data = await chrome.storage.local.get("theme");

  const theme = data.theme || {};

  const boundedNumber = (value, fallback, min, max) =>
    typeof value === "number" && Number.isFinite(value)
      ? Math.min(max, Math.max(min, value))
      : fallback;
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty(
    "--bb-course-width",
    `${boundedNumber(theme.courseWidth, 820, 500, 1200)}px`,
  );
  rootStyle.setProperty(
    "--bb-course-background",
    `rgba(255,255,255,${boundedNumber(theme.courseOpacity, 85, 0, 100) / 100})`,
  );

  /*
        We apply the wallpaper mainly to body.

        Then Blackboard inner containers are made
        transparent in content.css.
    */

  const body = document.body;

  if (!body) {
    return;
  }

  /*
        BACKGROUND COLOUR
    */

  if (theme.backgroundColor) {
    body.style.backgroundColor = theme.backgroundColor;
  } else {
    body.style.backgroundColor = "";
  }

  /*
        BACKGROUND IMAGE
    */

  if (theme.backgroundImage) {
    body.style.backgroundImage = `url("${theme.backgroundImage}")`;

    body.style.backgroundSize = "cover";

    body.style.backgroundPosition = "center";

    body.style.backgroundRepeat = "no-repeat";

    body.style.backgroundAttachment = "fixed";
  } else {
    body.style.backgroundImage = "none";
  }
}

/*
    --------------------------------------------
    FIND COURSES
    --------------------------------------------
*/

function findCourseRows() {
  return [...document.querySelectorAll("article.course-element-card")];
}

/*
    --------------------------------------------
    GET BLACKBOARD COURSE ID
    --------------------------------------------
*/

function getCourseId(row) {
  return row.dataset.courseId;
}

/*
    --------------------------------------------
    SHOW CUSTOM COURSE IMAGE
    --------------------------------------------
*/

function showCourseImage(row, imageData) {
  row.classList.add("bb-has-custom-image");
  let image = row.querySelector(".bb-custom-course-image");

  /*
        If the image element doesn't exist yet,
        create it.
    */

  if (!image) {
    image = document.createElement("div");

    image.className = "bb-custom-course-image";

    /*
            Put the image at the beginning
            of the Blackboard course card.
        */

    row.prepend(image);
  }

  /*
        Display chosen image
    */

  image.style.backgroundImage = `url("${imageData}")`;
}

function clearCourseImage(row) {
  row.querySelector(".bb-custom-course-image")?.remove();
  row.classList.remove("bb-has-custom-image");
}

async function removeCourseImage(courseId) {
  const data = await chrome.storage.local.get("courses");
  const courses = data.courses || {};
  if (courses[courseId]) {
    delete courses[courseId].image;
    if (Object.keys(courses[courseId]).length === 0) {
      delete courses[courseId];
    }
  }
  await chrome.storage.local.set({ courses });
  findCourseRows()
    .filter((row) => getCourseId(row) === courseId)
    .forEach(clearCourseImage);
}

let courseImageMenu;

function closeCourseImageMenu(restoreFocus = true) {
  if (!courseImageMenu) return;
  const { panel, button } = courseImageMenu;
  panel.remove();
  button.setAttribute("aria-expanded", "false");
  button.removeAttribute("aria-controls");
  courseImageMenu = undefined;
  if (restoreFocus) button.focus();
}

function toggleCourseImageMenu(courseId, row, button) {
  const wasOpen = courseImageMenu?.button === button;
  closeCourseImageMenu(false);
  if (wasOpen) return;

  const panel = document.createElement("div");
  panel.className = "bb-course-image-menu";
  panel.id = `bb-course-image-menu-${courseId}`;
  panel.setAttribute("role", "group");
  panel.setAttribute("aria-label", "Course image options");
  panel.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  const change = document.createElement("button");
  change.type = "button";
  change.textContent = "Choose image";
  change.addEventListener("click", () => {
    closeCourseImageMenu();
    chooseCourseImage(courseId, row);
  });

  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "Remove custom image";
  remove.disabled = !row.querySelector(".bb-custom-course-image");
  remove.addEventListener("click", async () => {
    remove.disabled = true;
    try {
      await removeCourseImage(courseId);
      closeCourseImageMenu();
    } catch (error) {
      remove.disabled = false;
      remove.textContent = "Could not remove — retry";
      console.error("Could not remove course image", error);
    }
  });

  panel.append(change, remove);
  row.appendChild(panel);
  courseImageMenu = { panel, button };
  button.setAttribute("aria-expanded", "true");
  button.setAttribute("aria-controls", panel.id);
  change.focus();
}

document.addEventListener("click", (event) => {
  if (
    courseImageMenu &&
    !courseImageMenu.panel.contains(event.target) &&
    !courseImageMenu.button.contains(event.target)
  ) {
    closeCourseImageMenu(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && courseImageMenu) {
    event.preventDefault();
    event.stopPropagation();
    closeCourseImageMenu();
  }
});

/*
    --------------------------------------------
    SAVE CUSTOM COURSE IMAGE
    --------------------------------------------
*/

function chooseCourseImage(courseId, row) {
  /*
        Create an invisible file picker
    */

  const input = document.createElement("input");

  input.type = "file";

  input.accept = "image/*";

  /*
        Wait until the user chooses an image
    */

  input.addEventListener("change", async () => {
    const file = input.files[0];

    if (!file) {
      return;
    }

    /*
                Read image into browser-compatible
                Base64/data URL.
            */

    const reader = new FileReader();

    reader.onload = async () => {
      /*
                        Load existing custom
                        course settings.
                    */

      const data = await chrome.storage.local.get("courses");

      const courses = data.courses || {};

      /*
                        Keep existing settings for
                        this course, but update image.
                    */

      courses[courseId] = {
        ...(courses[courseId] || {}),

        image: reader.result,
      };

      /*
                        Save to Chrome.
                    */

      await chrome.storage.local.set({
        courses,
      });

      /*
                        Immediately show image.
                    */

      showCourseImage(row, reader.result);
    };

    reader.readAsDataURL(file);
  });

  /*
        Open file picker.
    */

  input.click();
}

/*
    --------------------------------------------
    CUSTOMIZE COURSES
    --------------------------------------------
*/

async function customizeCourses() {
  const rows = findCourseRows();

  console.log("Found courses:", rows.length);

  const data = await chrome.storage.local.get("courses");

  const courses = data.courses || {};

  rows.forEach((row) => {
    /*
                Get Blackboard's course ID.
            */

    const courseId = getCourseId(row);

    if (!courseId) {
      return;
    }

    /*
                Restore saved custom image.
            */

    const savedCourse = courses[courseId];

    if (savedCourse?.image) {
      showCourseImage(row, savedCourse.image);
    } else {
      clearCourseImage(row);
    }

    /*
                If we've already added the edit
                button, stop here.

                Important:
                image restoration happens BEFORE
                this check.
            */

    if (row.dataset.bbCustomizerAdded) {
      return;
    }

    /*
                Mark this Blackboard course as
                already modified.
            */

    row.dataset.bbCustomizerAdded = "true";

    /*
                Needed so our absolute-positioned
                button sits correctly.
            */

    row.style.position = "relative";

    /*
                Create edit button.
            */

    const button = document.createElement("button");

    button.textContent = "✎";

    button.className = "bb-course-edit-button";

    button.title = "Edit course image";
    button.setAttribute("aria-label", "Edit course image");
    button.setAttribute("aria-expanded", "false");

    button.type = "button";

    /*
                Edit button click.
            */

    button.addEventListener("click", (event) => {
      /*
                        Don't make Blackboard
                        open the course.
                    */

      event.preventDefault();

      event.stopPropagation();

      toggleCourseImageMenu(courseId, row, button);
    });

    /*
                Add button into Blackboard
                course element.
            */

    row.appendChild(button);
  });
}

/*
    --------------------------------------------
    RUN CUSTOMIZER
    --------------------------------------------
*/

function customizeNavigation() {
  const navigation = document.getElementById("base_tools");

  if (!navigation) {
    return;
  }

  // Blackboard versions use different wrappers around the navigation.
  // Only clear narrow containers at the left edge, never the whole app.
  let container = navigation.parentElement;
  let outermost;

  while (container && container !== document.body) {
    const bounds = container.getBoundingClientRect();

    if (bounds.width > 0 && bounds.width <= 360 && bounds.left <= 40) {
      container.classList.add("bb-custom-navigation-layer");
      outermost = container;
    }

    container = container.parentElement;
  }

  const shell = outermost || navigation;
  document
    .querySelectorAll(".bb-custom-navigation-shell")
    .forEach((element) => {
      if (element !== shell) {
        element.classList.remove("bb-custom-navigation-shell");
        for (const property of [
          "background",
          "background-size",
          "background-position",
          "background-repeat",
          "background-attachment",
        ]) {
          element.style.removeProperty(property);
        }
      }
    });
  shell.classList.add("bb-custom-navigation-shell");

  // Keep the navbar opaque white, including the #base_tools fallback.
  shell.style.setProperty("background", "#ffffff", "important");

  // Clear painted layers inside the shell, including logo/footer wrappers.
  // Images, badges and interactive highlights retain their own appearance.
  shell
    .querySelectorAll("div, section, header, footer, ul, li")
    .forEach((element) => {
      if (
        !element.matches(".MuiBadge-root, .MuiBadge-badge, .MuiAvatar-root") &&
        !element.closest(".MuiBadge-root, .MuiAvatar-root")
      ) {
        element.classList.add("bb-custom-navigation-surface");
        element.style.setProperty("background", "transparent", "important");
      }
    });
}

window.addEventListener("resize", customizeNavigation);

function runCustomizer() {
  customizeNavigation();

  applyTheme();

  customizeCourses();
}

/*
    Initial run
*/

runCustomizer();

/*
    --------------------------------------------
    BLACKBOARD MUTATION OBSERVER
    --------------------------------------------

    Blackboard Ultra frequently updates the DOM
    without fully refreshing the page.

    Therefore we rerun whenever elements change.
*/

let mutationTimeout;

const observer = new MutationObserver(() => {
  /*
                Blackboard can trigger many
                mutations extremely quickly.

                Small debounce prevents us from
                running hundreds of times.
            */

  clearTimeout(mutationTimeout);

  mutationTimeout = setTimeout(() => {
    runCustomizer();
  }, 100);
});

observer.observe(document.body, {
  childList: true,

  subtree: true,
});

/*
    --------------------------------------------
    LISTEN FOR EXTENSION SETTING CHANGES
    --------------------------------------------
*/

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  runCustomizer();
});
