<!doctype html>
<html>
    <head>
        <title>Matrix Sauna Chat</title>
        <style>
            body {
                font-family: sans-serif;
                margin: 20px;
            }
            #messages {
                border: 1px solid #ccc;
                padding: 10px;
                height: 300px;
                overflow-y: scroll;
                margin-bottom: 10px;
            }
            .message {
                margin-bottom: 5px;
            }
            .message.sender {
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <h1>Matrix Sauna Chat</h1>
        <p>A minimal client exclusively for the #sauna:pramari.de room.</p>

        <div>
            <label for="userId">User ID:</label>
            <input
                type="text"
                id="userId"
                placeholder="Will be filled after SSO"
                readonly
            />
        </div>
        <button onclick="initiateSsoLogin()">Login with SSO & Join Chat</button>

        <hr />

        <div id="messages"></div>
        <input
            type="text"
            id="messageInput"
            placeholder="Type a message..."
            disabled
        />
        <button onclick="sendMessage()" disabled>Send</button>

        <!--
        By moving the SDK script to the end of the body and removing 'defer',
        we ensure it is downloaded and executed before our inline script runs.
        This is a classic and reliable way to handle script dependencies.
        -->
        <script src="https://unpkg.com/matrix-js-sdk@24.0.0/lib/browser-index.js"></script>
        <script>
            let matrixClient;
            let currentRoomId;

            const homeserverUrl = "https://pramari.de";
            const roomAlias = "#sauna:pramari.de";

            // Wait for both DOM and script to be ready
            let domReady = false;
            let scriptReady = false;

            function checkReady() {
                if (domReady && scriptReady) {
                    handleSsoCallback();
                }
            }

            document.addEventListener("DOMContentLoaded", () => {
                domReady = true;
                checkReady();
            });

            // Check if script is already loaded, or wait for it
            function waitForScript() {
                if (typeof matrixcs !== "undefined") {
                    console.log("Matrix SDK loaded successfully");
                    scriptReady = true;
                    checkReady();
                } else {
                    console.log("Waiting for Matrix SDK to load...");
                    setTimeout(waitForScript, 100);
                }
            }

            waitForScript();

            function getBaseRedirectUrl() {
                return window.location.origin + window.location.pathname;
            }

            async function initiateSsoLogin() {
                logToUI("Redirecting for SSO login...");
                localStorage.setItem("sso_roomAlias", roomAlias);

                const redirectUrl = getBaseRedirectUrl();
                const ssoRedirectEndpoint =
                    homeserverUrl.replace(/\/$/, "") +
                    "/_matrix/client/r0/login/sso/redirect?redirectUrl=" +
                    encodeURIComponent(redirectUrl);

                window.location.href = ssoRedirectEndpoint;
            }

            async function handleSsoCallback() {
                const urlParams = new URLSearchParams(window.location.search);
                const loginToken = urlParams.get("loginToken");
                const storedRoomAlias = localStorage.getItem("sso_roomAlias");

                if (loginToken && storedRoomAlias) {
                    logToUI("SSO login token received. Completing login...");

                    const cleanUrl = getBaseRedirectUrl();
                    window.history.replaceState({}, document.title, cleanUrl);
                    localStorage.removeItem("sso_roomAlias");

                    await completeSsoLoginAndStartChat(
                        homeserverUrl,
                        loginToken,
                        storedRoomAlias,
                    );
                } else {
                    logToUI("Ready to login via SSO.");
                    const loginButton = document.querySelector(
                        'button[onclick="initiateSsoLogin()"]',
                    );
                    if (loginButton) loginButton.disabled = false;
                }
            }

            async function completeSsoLoginAndStartChat(
                homeserverUrl,
                loginToken,
                roomAliasToJoin,
            ) {
                try {
                    // Check if matrixcs is available
                    if (typeof matrixcs === "undefined") {
                        logToUI(
                            "Error: Matrix SDK not loaded. Checking what's available...",
                        );
                        logToUI(
                            "Available globals: " +
                                Object.keys(window)
                                    .filter((k) => k.includes("matrix"))
                                    .join(", "),
                        );
                        throw new Error(
                            "Matrix SDK not loaded. Please check your internet connection and try again.",
                        );
                    }

                    logToUI(
                        "Matrix SDK loaded successfully. Creating client...",
                    );
                    matrixClient = matrixcs.createClient({
                        baseUrl: homeserverUrl,
                    });

                    logToUI("Logging in with SSO token...");
                    const loginResponse = await matrixClient.login(
                        "m.login.sso",
                        { token: loginToken },
                    );

                    logToUI(`Logged in as ${loginResponse.user_id}`);
                    document.getElementById("userId").value =
                        loginResponse.user_id;

                    document.querySelector(
                        'button[onclick="initiateSsoLogin()"]',
                    ).disabled = true;
                    document.getElementById("messageInput").disabled = false;
                    document.querySelector(
                        'button[onclick="sendMessage()"]',
                    ).disabled = false;

                    logToUI(`Joining room ${roomAliasToJoin}...`);
                    const room = await matrixClient.joinRoom(roomAliasToJoin);
                    currentRoomId = room.roomId;
                    logToUI(`Successfully joined ${roomAliasToJoin}`);

                    document.getElementById("messages").innerHTML = "";
                    logToUI("Initializing Matrix client...");

                    logToUI("Starting client and syncing...");
                    await matrixClient.startClient({ initialSyncLimit: 10 });

                    matrixClient.on(
                        "Room.timeline",
                        function (event, room, toStartOfTimeline) {
                            if (
                                event.getType() !== "m.room.message" ||
                                room.roomId !== currentRoomId
                            ) {
                                return;
                            }
                            if (toStartOfTimeline) {
                                return;
                            }
                            const sender = event.getSender();
                            const messageBody = event.getContent().body;
                            logToUI(`${sender}: ${messageBody}`, true);
                        },
                    );

                    matrixClient.once("sync", function (state, prevState, res) {
                        if (state === "PREPARED") {
                            logToUI(
                                "Client synced. You can now send/receive messages.",
                            );
                        } else if (state === "ERROR") {
                            logToUI(
                                `Sync error: ${res ? res.error : "Unknown error"}`,
                            );
                        }
                    });
                } catch (error) {
                    logToUI(
                        `Error during SSO login or chat setup: ${error.message || error.toString()}`,
                    );
                    console.error("SSO Login/Chat Setup Error:", error);
                    const loginButton = document.querySelector(
                        'button[onclick="initiateSsoLogin()"]',
                    );
                    if (loginButton) loginButton.disabled = false;
                    document.getElementById("messageInput").disabled = true;
                    document.querySelector(
                        'button[onclick="sendMessage()"]',
                    ).disabled = true;
                }
            }

            async function sendMessage() {
                if (!matrixClient || !currentRoomId) {
                    alert("Client not started or Room not joined.");
                    return;
                }
                const messageInput = document.getElementById("messageInput");
                const messageText = messageInput.value;

                if (!messageText.trim()) {
                    return;
                }

                const content = {
                    body: messageText,
                    msgtype: "m.text",
                };

                try {
                    matrixClient.sendEvent(
                        currentRoomId,
                        "m.room.message",
                        content,
                        "",
                        (err, res) => {
                            if (err) {
                                logToUI(`Error sending message: ${err}`);
                                console.error("Send event error:", err);
                            }
                        },
                    );
                    messageInput.value = "";
                } catch (error) {
                    logToUI(`Error sending message: ${error.toString()}`);
                    console.error("Error in sendMessage:", error);
                }
            }

            function logToUI(message, isChatMessage = false) {
                const messagesDiv = document.getElementById("messages");
                const messageDiv = document.createElement("div");
                if (isChatMessage) {
                    const parts = message.split(/:(.*)/s);
                    const sender = parts[0];
                    const msg = parts[1] || "";
                    messageDiv.innerHTML = `<span class="sender">${sender}:</span> <span class="text">${msg}</span>`;
                } else {
                    messageDiv.textContent = ` ${message}`;
                }
                messageDiv.classList.add("message");
                messagesDiv.appendChild(messageDiv);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
        </script>
    </body>
</html>

