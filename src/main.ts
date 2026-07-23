import { createApp } from "vue";
import { registerShareSupport } from "@/composables/usePumlShare";
import { initPwaUpdate } from "@/composables/usePwaUpdate";
import App from "./App.vue";
import { initInstallPromptCapture } from "./pwa/installPromptState";
import "./styles/app.css";

initInstallPromptCapture();
initPwaUpdate();
void registerShareSupport();

createApp(App).mount("#app");
