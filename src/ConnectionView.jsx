# Clone fresh (or pull if you have it locally)
git clone https://github.com/benwald21/pitt-command.git
cd pitt-command

# Copy the two changed files from the remote session, OR manually apply:
# 1. Create src/ConnectionView.jsx  (the full newsletter system)
# 2. Edit src/App.jsx — add these 3 lines:

# Line 3 (after lucide-react import):
import ConnectionView from './ConnectionView.jsx';

# In navItems array (after recruiting):
{ id: 'connection', label: 'Connection', icon: Mail },

# In the view render block (after recruiting view):
{loaded && view === 'connection' && <ConnectionView />}

git add src/ConnectionView.jsx src/App.jsx
git commit -m "Add Connection newsletter system for Alumni & Season Ticket Holders"
git push origin main
