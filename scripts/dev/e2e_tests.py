import time
import os
from playwright.sync_api import sync_playwright, expect

BASE_URL = "http://localhost:5173"
LOG_DIR = os.path.join(os.getcwd(), "e2e_logs")

if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

def log_step(message):
    print(f"[*] {message}")

def run_tests():
    with sync_playwright() as p:
        # Use a non-headless browser if you want to watch, but we'll use headless for automation
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        page = context.new_page()

        try:
            # -------------------------------------------------------------
            # Scenario 1: Public Portal Verification
            # -------------------------------------------------------------
            log_step("Scenario 1: Navigating to Public Portal")
            page.goto(BASE_URL)
            page.wait_for_load_state('networkidle')
            
            # Take a screenshot of the homepage
            page.screenshot(path=os.path.join(LOG_DIR, "1_homepage.png"), full_page=True)
            log_step("Homepage loaded successfully.")

            # Check if navigation links exist (using standard semantic HTML or classes)
            expect(page.locator("text=Mitradesa")).to_be_visible()

            # -------------------------------------------------------------
            # Scenario 2: Admin Authentication Flow
            # -------------------------------------------------------------
            log_step("Scenario 2: Testing Admin Login")
            page.goto(f"{BASE_URL}/admin/login")
            page.wait_for_load_state('networkidle')
            page.screenshot(path=os.path.join(LOG_DIR, "2_admin_login_page.png"))

            # Fill in the login form (Assuming standard input fields based on common React setups)
            # The exact selectors depend on the actual UI, so we'll try to guess based on placeholder or label
            email_input = page.locator("input[type='email']")
            if email_input.count() > 0:
                email_input.fill("admin@mitradesa.id")
            else:
                log_step("WARNING: Email input not found.")
            
            password_input = page.locator("input[type='password']")
            if password_input.count() > 0:
                password_input.fill(os.environ.get("TEST_PASSWORD", "password123"))
            else:
                log_step("WARNING: Password input not found.")

            login_button = page.locator("button:has-text('Masuk')")
            if login_button.count() > 0:
                login_button.click()
            elif page.locator("button[type='submit']").count() > 0:
                page.locator("button[type='submit']").click()
            else:
                log_step("WARNING: Login button not found.")

            # Wait for dashboard to load
            page.wait_for_load_state('networkidle')
            time.sleep(2) # Extra buffer for animations
            page.screenshot(path=os.path.join(LOG_DIR, "3_admin_dashboard.png"), full_page=True)
            log_step("Login completed (check screenshot for success).")

            # -------------------------------------------------------------
            # Scenario 3: Feature Integration Verification (Saran & Aduan)
            # -------------------------------------------------------------
            log_step("Scenario 3: Navigating to Saran & Aduan")
            page.goto(f"{BASE_URL}/admin/pemerintahan/saran-aduan")
            page.wait_for_load_state('networkidle')
            page.screenshot(path=os.path.join(LOG_DIR, "4_saran_aduan_page.png"), full_page=True)
            log_step("Saran & Aduan page loaded.")

            # -------------------------------------------------------------
            # Scenario 4: E-Voting Public
            # -------------------------------------------------------------
            log_step("Scenario 4: Navigating to E-Voting Public")
            page.goto(f"{BASE_URL}/e-voting")
            page.wait_for_load_state('networkidle')
            page.screenshot(path=os.path.join(LOG_DIR, "5_e_voting_page.png"), full_page=True)
            log_step("E-Voting page loaded.")
            
            log_step("All E2E scenarios executed successfully.")
            
        except Exception as e:
            log_step(f"ERROR: {str(e)}")
            page.screenshot(path=os.path.join(LOG_DIR, "error_state.png"))
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    print("Starting E2E Tests...")
    run_tests()
    print("Finished.")
