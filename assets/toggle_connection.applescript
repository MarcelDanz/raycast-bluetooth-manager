# This script requires the Bluetooth menu bar item to be visible.
# It also requires Raycast to have Accessibility permissions in System Settings.

on run argv
	if (count of argv) is 0 then
		return "Error: No device name provided."
	end if

	set deviceName to item 1 of argv
	
	tell application "System Events"
		try
			tell process "ControlCenter"
				set btMenuBarItem to menu bar item "Bluetooth" of menu bar 1
				click btMenuBarItem
				
				# Wait for the menu to appear
				delay 0.5
				
				# Find the menu item for the device.
				set deviceMenuItem to menu item deviceName of menu 1 of btMenuBarItem
				
				# Most devices have a submenu with actions.
				if exists (menu 1 of deviceMenuItem) then
					if exists (menu item "Disconnect" of menu 1 of deviceMenuItem) then
						click menu item "Disconnect" of menu 1 of deviceMenuItem
					else if exists (menu item "Connect" of menu 1 of deviceMenuItem) then
						click menu item "Connect" of menu 1 of deviceMenuItem
					else
						click btMenuBarItem -- Close menu
						return "Error: Found device but no Connect/Disconnect action."
					end if
				else
					# For simpler devices, clicking the item itself might toggle connection.
					click deviceMenuItem
				end if
				
			end tell
		on error errMsg
			# Ensure the menu is closed if an error occurs
			try
				tell application "System Events" to tell process "ControlCenter" to click menu bar item "Bluetooth" of menu bar 1
			end try
			return "AppleScript Error: " & errMsg
		end try
	end tell
	
	return "Toggled connection for " & deviceName
end run
