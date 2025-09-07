# This script requires the Bluetooth menu bar item to be visible.
# It also requires Raycast to have Accessibility permissions in System Settings.

on run argv
	if (count of argv) is 0 then
		return "Error: No device name provided."
	end if
	set deviceName to item 1 of argv

	tell application "System Events"
		if UI elements enabled is false then
			return "Error: Accessibility permissions are not enabled. Please grant Raycast accessibility permissions in System Settings."
		end if

		set targetProcess to missing value
		if exists process "ControlCenter" then
			set targetProcess to process "ControlCenter"
		else if exists process "SystemUIServer" then
			set targetProcess to process "SystemUIServer"
		else
			return "Error: Could not find a UI process (ControlCenter or SystemUIServer) to script."
		end if

		try
			tell targetProcess
				set menuBar to menu bar 1
				set btMenuBarItems to (menu bar items of menuBar where description is "Bluetooth")

				if (count of btMenuBarItems) is 0 then
					return "Error: Bluetooth menu bar item not found. Please ensure it is visible in the menu bar."
				end if
				set btMenuBarItem to item 1 of btMenuBarItems

				perform action "AXPress" of btMenuBarItem
				delay 0.5 -- Wait for menu to open

				try
					set deviceMenuItem to menu item deviceName of menu 1 of btMenuBarItem

					-- Just click the device menu item directly to toggle its connection status.
					perform action "AXPress" of deviceMenuItem
				on error
					-- This error means the device item was not found.
					-- Close the menu and report error.
					perform action "AXPress" of btMenuBarItem
					return "Error: Device '" & deviceName & "' not found in the Bluetooth menu."
				end try
			end tell
		on error errMsg
			-- If an error happens, try to close the Bluetooth menu before quitting.
			try
				tell targetProcess to perform action "AXPress" of (item 1 of (menu bar items of menu bar 1 where description is "Bluetooth"))
			end try
			return "AppleScript Error: " & errMsg
		end try
	end tell

	return "Toggled connection for " & deviceName
end run
