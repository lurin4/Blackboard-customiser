const backgroundColorInput = document.getElementById("backgroundColor");

const backgroundImageInput = document.getElementById("backgroundImage");

const saveButton = document.getElementById("saveBackground");

const removeImageButton = document.getElementById("removeBackgroundImage");

const resetThemeButton = document.getElementById("resetTheme");

const statusText = document.getElementById("status");

const appearanceDefaults = {
  courseWidth: 820,
  courseOpacity: 85,
};

const appearanceInputs = Object.fromEntries(
  Object.keys(appearanceDefaults).map((key) => [key, document.getElementById(key)]),
);

function updateAppearanceLabels() {
  for (const key of ["courseWidth", "courseOpacity"]) {
    document.getElementById(`${key}Value`).textContent =
      appearanceInputs[key].value + (key === "courseWidth" ? "px" : "%");
  }
}

function restoreAppearanceInputs(theme) {
  for (const [key, fallback] of Object.entries(appearanceDefaults)) {
    appearanceInputs[key].value = theme[key] ?? fallback;
  }
  updateAppearanceLabels();
}

Object.values(appearanceInputs).forEach((input) => {
  input.addEventListener("input", updateAppearanceLabels);
});

function readAppearanceInputs() {
  return Object.fromEntries(Object.keys(appearanceDefaults).map((key) => [
    key,
    Number(appearanceInputs[key].value),
  ]));
}

async function loadSettings() {
  const data = await chrome.storage.local.get("theme");

  const theme = data.theme || {};

  restoreAppearanceInputs(theme);

  if (theme.backgroundColor) {
    backgroundColorInput.value = theme.backgroundColor;
  }
}

function showStatus(message) {
  statusText.textContent = message;

  setTimeout(() => {
    statusText.textContent = "";
  }, 2000);
}

saveButton.addEventListener("click", async () => {
  const data = await chrome.storage.local.get("theme");

  const theme = data.theme || {};

  theme.backgroundColor = backgroundColorInput.value;

  Object.assign(theme, readAppearanceInputs());

  const file = backgroundImageInput.files[0];

  if (!file) {
    await chrome.storage.local.set({
      theme,
    });

    showStatus("Appearance saved!");

    return;
  }

  const reader = new FileReader();

  reader.onload = async () => {
    theme.backgroundImage = reader.result;

    await chrome.storage.local.set({
      theme,
    });

    showStatus("Appearance saved!");
  };

  reader.readAsDataURL(file);
});

removeImageButton.addEventListener("click", async () => {
  const data = await chrome.storage.local.get("theme");

  const theme = data.theme || {};

  delete theme.backgroundImage;

  await chrome.storage.local.set({
    theme,
  });

  backgroundImageInput.value = "";

  showStatus("Background image removed.");
});

resetThemeButton.addEventListener("click", async () => {
  await chrome.storage.local.remove("theme");

  backgroundColorInput.value = "#f5f5f5";

  backgroundImageInput.value = "";

  restoreAppearanceInputs({});

  showStatus("Theme reset.");
});

loadSettings();
