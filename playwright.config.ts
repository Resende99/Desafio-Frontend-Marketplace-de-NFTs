import { defineConfig, devices } from '@playwright/test'
const usePreview = process.env.PLAYWRIGHT_PREVIEW === 'true'
export default defineConfig({
  testDir:'./tests/e2e',fullyParallel:true,forbidOnly:!!process.env.CI,retries:process.env.CI?1:0,workers:2,
  reporter:[['list'],['html',{outputFolder:'playwright-report',open:'never'}]],
  use:{baseURL:'http://127.0.0.1:4180',trace:'retain-on-failure',screenshot:'only-on-failure',video:'retain-on-failure'},
  projects:[{name:'chromium-desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:960}}},{name:'chromium-mobile',use:{...devices['Pixel 7'],viewport:{width:390,height:844}}}],
  webServer:{command:usePreview?'npm run preview -- --host 127.0.0.1 --port 4180':'npm run dev -- --host 127.0.0.1 --port 4180',url:'http://127.0.0.1:4180',reuseExistingServer:!process.env.CI,timeout:120_000},
})
