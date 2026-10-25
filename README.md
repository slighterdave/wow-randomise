# ⚔️ wow-randomise

A tiny website for a 4-man WoW Classic ("Forever") party. Everyone types in their
character name + real name, then spins a wheel for **role → class → race**.

* The party is **1 Tank, 1 Healer, 2 DPS**. The role wheel only contains roles still open,
  so the last person automatically gets whatever is left (e.g. 1 tank + 2 DPS taken → healer).
* Every **class can only be used once** (one warrior!). Once someone gets it, it leaves the pool.
  The wheel also never offers a class that would make a missing role impossible to fill.
* **Races can repeat** (as many undead as you like). Only races that can really be that class appear.
* Optional faction lock (Alliance / Horde / Any) so you can all play together.
* Names and results are saved on the server, so all four of you see the same party.

Races/classes are the original Classic ones: Human, Dwarf, Night Elf, Gnome, Orc, Undead, Tauren, Troll;
Warrior, Paladin, Druid, Priest, Shaman, Hunter, Rogue, Mage, Warlock.
(Paladin is Alliance-only and Shaman Horde-only in Classic — the wheel handles that.)

## Run it on your own computer (2 minutes)

1. Install [Node.js](https://nodejs.org) (version 18 or newer).
2. In a terminal, inside this folder:
   ```
   npm start
   ```
3. Open <http://localhost:3000>.

There is nothing to `npm install` — the site has no dependencies.
Run the tests with `npm test`.

## Put it on AWS (ELI5)

Think of AWS as renting a computer that is always on. We rent the cheapest one,
copy this website onto it, and turn it on. The easiest rental is **Amazon Lightsail**.

### Step 1 – Rent the computer
1. Make an AWS account at <https://aws.amazon.com>.
2. Go to **Lightsail** → **Create instance**.
3. Pick **Linux/Unix**, then **OS Only → Ubuntu 22.04 LTS**.
4. Pick the cheapest plan (a few dollars a month) and click **Create instance**.

### Step 2 – Open the door (port 80)
1. Click your instance → **Networking** tab.
2. Under **IPv4 Firewall** make sure **HTTP (port 80)** is there. Add it if not.
3. Under **Public IP**, click **Create static IP** and attach it, so the address never changes.
   Write that IP down.

### Step 3 – Log in
Click your instance → **Connect using SSH**. A black terminal window opens. Everything below is typed there.

### Step 4 – Install Node and download the site
```
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
git clone https://github.com/slighterdave/wow-randomise.git
cd wow-randomise
```

### Step 5 – Make it start by itself and keep running
```
sudo tee /etc/systemd/system/wow.service > /dev/null <<UNIT
[Unit]
Description=WoW randomiser
After=network.target

[Service]
WorkingDirectory=$HOME/wow-randomise
ExecStart=/usr/bin/node server.js
Environment=PORT=80
Restart=always
User=root

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable --now wow
```

### Step 6 – Visit it
Open `http://YOUR-STATIC-IP` in a browser and send that link to your 3 friends. Done! 🎉

### Updating later
```
cd ~/wow-randomise && git pull && sudo systemctl restart wow
```

### Good to know
* Saved data lives in `data/state.json` inside the project folder (it survives restarts and updates).
* To start over, use the **Reset all spins** button on the page.
* **There is no password.** Anyone who has the link can use it. That's fine for four friends,
  but don't share the link publicly.
* Want to use EC2 instead of Lightsail? Same steps: launch an Ubuntu instance, allow inbound
  port 80 in the security group, then follow Step 3 onward.
* Something broken? `sudo systemctl status wow` and `sudo journalctl -u wow -n 50` show what happened.
