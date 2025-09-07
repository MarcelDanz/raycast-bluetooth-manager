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
				
				# The device name might be a submenu
				set deviceMenuItem to menu item deviceName of menu 1 of btMenuBarItem
				
				if exists menu item "Disconnect" of deviceMenuItem then
					click menu item "Disconnect" of deviceMenuItem
				else if exists menu item "Connect" of deviceMenuItem then
					click menu item "Connect" of deviceMenuItem
				else
					# If neither is found, the device might not be connectable
					# or the action is in a submenu. This handles simple cases.
					# Close the menu
					click btMenuBarItem
					return "Error: Could not find Connect/Disconnect action for " & deviceName
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
