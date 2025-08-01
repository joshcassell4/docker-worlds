#!/usr/bin/env python3
"""
Data Matrix World - Matrix-style cascading data visualization
Watch your data fall like digital rain with interactive zones
"""

import asyncio
import random
import time
import string
import json
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
from blessed import Terminal
import numpy as np
from rich.console import Console
from rich.text import Text
import pyfiglet

# Initialize terminal and console
term = Terminal()
console = Console()

# Color schemes
COLOR_SCHEMES = {
    'classic': {
        'primary': [(0, 255, 0), (0, 200, 0), (0, 150, 0), (0, 100, 0), (0, 50, 0)],
        'highlight': (150, 255, 150),
        'background': (0, 20, 0)
    },
    'cyberpunk': {
        'primary': [(255, 0, 255), (200, 0, 200), (150, 0, 150), (100, 0, 100), (50, 0, 50)],
        'highlight': (0, 255, 255),
        'background': (20, 0, 20)
    },
    'rainbow': {
        'primary': [(255, 0, 0), (255, 127, 0), (255, 255, 0), (0, 255, 0), (0, 0, 255), (75, 0, 130), (148, 0, 211)],
        'highlight': (255, 255, 255),
        'background': (10, 10, 10)
    },
    'fire': {
        'primary': [(255, 200, 0), (255, 150, 0), (255, 100, 0), (255, 50, 0), (200, 0, 0)],
        'highlight': (255, 255, 100),
        'background': (30, 0, 0)
    },
    'ice': {
        'primary': [(100, 200, 255), (50, 150, 255), (0, 100, 255), (0, 50, 200), (0, 0, 150)],
        'highlight': (200, 255, 255),
        'background': (0, 10, 30)
    }
}

# Character sets for different data types
CHAR_SETS = {
    'binary': '01',
    'hex': '0123456789ABCDEF',
    'unicode': ''.join(chr(i) for i in range(0x30A0, 0x30FF)),  # Katakana
    'ascii': string.ascii_letters + string.digits + string.punctuation,
    'custom': '⌬⌭⌮⌯⌰⌱⌲⌳⌴⌵⌶⌷⌸⌹⌺⌻⌼⌽⌾⌿⍀⍁⍂⍃⍄⍅⍆⍇⍈⍉⍊⍋⍌⍍⍎⍏'
}

@dataclass
class DataStream:
    """Represents a single column of falling data"""
    column: int
    position: float
    speed: float
    length: int
    chars: List[str]
    colors: List[Tuple[int, int, int]]
    data_type: str
    trail_length: int
    last_update: float
    glitch_probability: float
    
    def __init__(self, column: int, width: int, height: int, data_type: str = 'unicode'):
        self.column = column
        self.position = random.uniform(-height, 0)
        self.speed = random.uniform(0.3, 1.5)
        self.length = random.randint(5, 20)
        self.data_type = data_type
        self.trail_length = random.randint(10, 30)
        self.last_update = time.time()
        self.glitch_probability = random.uniform(0.001, 0.01)
        self.chars = []
        self.colors = []
        self.regenerate_chars()
    
    def regenerate_chars(self):
        """Generate new characters for the stream"""
        char_set = CHAR_SETS.get(self.data_type, CHAR_SETS['unicode'])
        self.chars = [random.choice(char_set) for _ in range(self.length + self.trail_length)]
    
    def update(self, dt: float, height: int):
        """Update stream position and characters"""
        self.position += self.speed * dt * 20
        
        # Regenerate when stream goes off screen
        if self.position > height + self.trail_length:
            self.position = -self.length
            self.speed = random.uniform(0.3, 1.5)
            self.regenerate_chars()
        
        # Random character changes (glitch effect)
        if random.random() < self.glitch_probability:
            idx = random.randint(0, len(self.chars) - 1)
            char_set = CHAR_SETS.get(self.data_type, CHAR_SETS['unicode'])
            self.chars[idx] = random.choice(char_set)

class InteractiveZone:
    """An area where users can interact with the matrix"""
    def __init__(self, x: int, y: int, width: int, height: int, data_type: str):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.data_type = data_type
        self.captured_data = []
        self.active = False
        
    def contains(self, x: int, y: int) -> bool:
        """Check if a point is within the zone"""
        return (self.x <= x < self.x + self.width and 
                self.y <= y < self.y + self.height)
    
    def capture(self, char: str):
        """Capture a character passing through the zone"""
        self.captured_data.append({
            'char': char,
            'time': time.time(),
            'type': self.data_type
        })
        if len(self.captured_data) > 100:
            self.captured_data.pop(0)

class DataMatrixWorld:
    def __init__(self):
        self.term = term
        self.width = self.term.width
        self.height = self.term.height
        self.running = True
        self.paused = False
        self.color_scheme = 'classic'
        self.current_scheme = COLOR_SCHEMES[self.color_scheme]
        
        # Initialize data streams
        self.streams: List[DataStream] = []
        self.num_columns = min(self.width, 200)  # Limit columns for performance
        for i in range(0, self.width, max(1, self.width // self.num_columns)):
            data_type = random.choice(list(CHAR_SETS.keys()))
            self.streams.append(DataStream(i, self.width, self.height, data_type))
        
        # Interactive zones
        self.zones: List[InteractiveZone] = []
        self.selected_zone = 0
        self.show_zones = False
        self.captured_messages = []
        
        # Statistics
        self.stats = {
            'total_chars': 0,
            'captured_chars': 0,
            'glitches': 0,
            'messages_decoded': 0
        }
        
        # Hidden messages
        self.hidden_messages = [
            "FOLLOW THE WHITE RABBIT",
            "THERE IS NO SPOON",
            "THE MATRIX HAS YOU",
            "WAKE UP NEO",
            "KNOCK KNOCK"
        ]
        self.current_message = ""
        self.message_position = 0
        
    def create_zones(self):
        """Create interactive capture zones"""
        self.zones = [
            InteractiveZone(10, 5, 20, 10, 'binary'),
            InteractiveZone(self.width - 30, 5, 20, 10, 'hex'),
            InteractiveZone(self.width // 2 - 10, self.height // 2 - 5, 20, 10, 'unicode'),
            InteractiveZone(10, self.height - 15, 30, 10, 'custom')
        ]
    
    def rgb_to_term_color(self, r: int, g: int, b: int) -> str:
        """Convert RGB to terminal color escape sequence"""
        return f'\033[38;2;{r};{g};{b}m'
    
    def render_stream(self, stream: DataStream, buffer: List[List[Optional[Tuple[str, str]]]]):
        """Render a single data stream to the buffer"""
        colors = self.current_scheme['primary']
        highlight = self.current_scheme['highlight']
        
        for i, char in enumerate(stream.chars):
            y = int(stream.position - i)
            if 0 <= y < self.height and stream.column < self.width:
                # Calculate color based on position in trail
                if i == 0:
                    # Leading character is bright
                    color = self.rgb_to_term_color(*highlight)
                else:
                    # Trail fades out
                    color_idx = min(i * len(colors) // stream.trail_length, len(colors) - 1)
                    color = self.rgb_to_term_color(*colors[color_idx])
                
                # Apply glitch effect occasionally
                if random.random() < 0.001:
                    char = random.choice(CHAR_SETS['custom'])
                    self.stats['glitches'] += 1
                
                buffer[y][stream.column] = (char, color)
                self.stats['total_chars'] += 1
                
                # Check if character is in an interactive zone
                if self.show_zones:
                    for zone in self.zones:
                        if zone.contains(stream.column, y) and zone.active:
                            zone.capture(char)
                            self.stats['captured_chars'] += 1
    
    def render_zones(self, buffer: List[List[Optional[Tuple[str, str]]]]):
        """Render interactive zones"""
        if not self.show_zones:
            return
            
        for i, zone in enumerate(self.zones):
            color = self.rgb_to_term_color(255, 255, 0) if i == self.selected_zone else self.rgb_to_term_color(100, 100, 100)
            
            # Draw zone borders
            for x in range(zone.x, min(zone.x + zone.width, self.width)):
                if zone.y < self.height:
                    buffer[zone.y][x] = ('─', color)
                if zone.y + zone.height - 1 < self.height:
                    buffer[zone.y + zone.height - 1][x] = ('─', color)
            
            for y in range(zone.y, min(zone.y + zone.height, self.height)):
                if zone.x < self.width:
                    buffer[y][zone.x] = ('│', color)
                if zone.x + zone.width - 1 < self.width:
                    buffer[y][zone.x + zone.width - 1] = ('│', color)
            
            # Draw corners
            if zone.y < self.height and zone.x < self.width:
                buffer[zone.y][zone.x] = ('┌', color)
            if zone.y < self.height and zone.x + zone.width - 1 < self.width:
                buffer[zone.y][zone.x + zone.width - 1] = ('┐', color)
            if zone.y + zone.height - 1 < self.height and zone.x < self.width:
                buffer[zone.y + zone.height - 1][zone.x] = ('└', color)
            if zone.y + zone.height - 1 < self.height and zone.x + zone.width - 1 < self.width:
                buffer[zone.y + zone.height - 1][zone.x + zone.width - 1] = ('┘', color)
            
            # Show zone info
            if i == self.selected_zone and zone.y + 1 < self.height:
                info = f"[{zone.data_type}] {len(zone.captured_data)} captured"
                for j, char in enumerate(info[:zone.width-2]):
                    if zone.x + 1 + j < self.width:
                        buffer[zone.y + 1][zone.x + 1 + j] = (char, color)
    
    def render_ui(self, buffer: List[List[Optional[Tuple[str, str]]]]):
        """Render UI elements"""
        # Title
        title = "DATA MATRIX WORLD"
        title_color = self.rgb_to_term_color(0, 255, 255)
        for i, char in enumerate(title):
            if i < self.width:
                buffer[0][i] = (char, title_color)
        
        # Status bar
        status = f"Scheme: {self.color_scheme} | Zones: {'ON' if self.show_zones else 'OFF'} | " \
                f"Captured: {self.stats['captured_chars']} | FPS: {int(1/0.033)}"
        status_color = self.rgb_to_term_color(200, 200, 200)
        for i, char in enumerate(status):
            if i < self.width and self.height - 1 >= 0:
                buffer[self.height - 1][i] = (char, status_color)
        
        # Controls hint
        controls = "[Space] Pause [Z] Zones [C] Colors [Q] Quit"
        for i, char in enumerate(controls):
            if self.width - len(controls) + i < self.width and self.height - 2 >= 0:
                buffer[self.height - 2][self.width - len(controls) + i] = (char, status_color)
    
    def render_frame(self) -> str:
        """Render complete frame"""
        # Create buffer
        buffer: List[List[Optional[Tuple[str, str]]]] = [[None for _ in range(self.width)] for _ in range(self.height)]
        
        # Render streams
        if not self.paused:
            for stream in self.streams:
                self.render_stream(stream, buffer)
        
        # Render zones
        self.render_zones(buffer)
        
        # Render UI
        self.render_ui(buffer)
        
        # Convert buffer to string
        output = []
        bg = self.current_scheme['background']
        bg_color = f'\033[48;2;{bg[0]};{bg[1]};{bg[2]}m'
        
        for row in buffer:
            line = bg_color
            for cell in row:
                if cell:
                    char, color = cell
                    line += color + char
                else:
                    line += ' '
            line += '\033[0m'  # Reset
            output.append(line)
        
        return '\n'.join(output)
    
    async def update_streams(self):
        """Update all data streams"""
        while self.running:
            if not self.paused:
                current_time = time.time()
                for stream in self.streams:
                    dt = current_time - stream.last_update
                    stream.update(dt, self.height)
                    stream.last_update = current_time
            
            await asyncio.sleep(0.033)  # ~30 FPS
    
    async def render_loop(self):
        """Main rendering loop"""
        with self.term.fullscreen(), self.term.cbreak(), self.term.hidden_cursor():
            while self.running:
                # Clear and render
                print(self.term.home + self.render_frame(), end='', flush=True)
                await asyncio.sleep(0.033)
    
    async def handle_input(self):
        """Handle keyboard input"""
        with self.term.cbreak():
            while self.running:
                key = self.term.inkey(timeout=0.1)
                
                if key.lower() == 'q':
                    self.running = False
                elif key == ' ':
                    self.paused = not self.paused
                elif key.lower() == 'z':
                    self.show_zones = not self.show_zones
                    if self.show_zones and not self.zones:
                        self.create_zones()
                elif key.lower() == 'c':
                    # Cycle color schemes
                    schemes = list(COLOR_SCHEMES.keys())
                    idx = schemes.index(self.color_scheme)
                    self.color_scheme = schemes[(idx + 1) % len(schemes)]
                    self.current_scheme = COLOR_SCHEMES[self.color_scheme]
                elif key.name == 'KEY_TAB' and self.show_zones:
                    # Select next zone
                    self.selected_zone = (self.selected_zone + 1) % len(self.zones)
                elif key.name == 'KEY_ENTER' and self.show_zones:
                    # Toggle selected zone
                    self.zones[self.selected_zone].active = not self.zones[self.selected_zone].active
                
                await asyncio.sleep(0.01)
    
    async def run(self):
        """Run the matrix world"""
        # Start all tasks
        await asyncio.gather(
            self.update_streams(),
            self.render_loop(),
            self.handle_input()
        )

def main():
    """Entry point"""
    # Show intro
    console.clear()
    title = pyfiglet.figlet_format("MATRIX", font="banner3-D")
    console.print(f"[bright_green]{title}[/bright_green]")
    console.print("[bright_cyan]Initializing data streams...[/bright_cyan]")
    time.sleep(1)
    
    console.print("[bright_yellow]You are about to enter the Matrix.[/bright_yellow]")
    console.print("[dim]Use [bright_white]Z[/bright_white] to activate capture zones[/dim]")
    console.print("[dim]Use [bright_white]C[/bright_white] to change color schemes[/dim]")
    console.print("[dim]Use [bright_white]Space[/bright_white] to pause the stream[/dim]")
    time.sleep(2)
    
    try:
        world = DataMatrixWorld()
        asyncio.run(world.run())
    except KeyboardInterrupt:
        pass
    finally:
        console.clear()
        console.print("\n[bright_green]You have been disconnected from the Matrix.[/bright_green]")
        console.print("[dim]Remember... there is no spoon.[/dim]\n")

if __name__ == "__main__":
    main()