#!/usr/bin/env python3
"""
Text Symphony World - A colorful terminal orchestra
Watch as text streams dance and flow across your terminal in a mesmerizing symphony
"""

import asyncio
import random
import time
import math
from dataclasses import dataclass
from typing import List, Tuple
from rich.console import Console
from rich.live import Live
from rich.layout import Layout
from rich.panel import Panel
from rich.text import Text
from rich.align import Align
from rich.color import Color
from blessed import Terminal
import pyfiglet
import numpy as np

console = Console()
term = Terminal()

# Color schemes for different instruments
COLOR_SCHEMES = {
    'strings': ['#FF6B6B', '#FFE66D', '#4ECDC4', '#95E1D3', '#F38181'],
    'percussion': ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF'],
    'wind': ['#6A0572', '#AB83A1', '#C874B2', '#D5A4C4', '#F5D5D5'],
    'synth': ['#00F5FF', '#00FFF0', '#FF10F0', '#FFFF00', '#FF00FF'],
    'bass': ['#001D3D', '#003566', '#FFC300', '#FFD60A', '#FFA200']
}

# ASCII patterns for different effects
PATTERNS = {
    'wave': '~≈≋～∼∿',
    'cascade': '┆┇┊┋╎╏║▌▐│',
    'notes': '♪♫♬♩♮♯♭',
    'particles': '·∙•◦○◉◎◈◊',
    'stars': '✦✧★☆✩✪✫✬✭✮✯✰⋆',
    'flow': '←↑→↓↔↕↖↗↘↙⇐⇑⇒⇓⇔⇕'
}

@dataclass
class TextStream:
    """Represents a single text stream in the symphony"""
    instrument: str
    position: float
    velocity: float
    frequency: float
    amplitude: float
    color_index: int
    pattern: str
    phase: float

    def __init__(self, instrument: str, index: int):
        self.instrument = instrument
        self.position = random.uniform(0, 100)
        self.velocity = random.uniform(0.5, 2.0)
        self.frequency = random.uniform(0.1, 0.5)
        self.amplitude = random.uniform(10, 30)
        self.color_index = 0
        self.pattern = random.choice(list(PATTERNS.keys()))
        self.phase = random.uniform(0, 2 * math.pi)
        self.index = index

    def update(self, dt: float):
        """Update stream position and properties"""
        self.phase += self.frequency * dt
        self.position += self.velocity * dt
        if self.position > 100:
            self.position = 0
            self.pattern = random.choice(list(PATTERNS.keys()))
            self.velocity = random.uniform(0.5, 2.0)
        
        self.color_index = (self.color_index + dt * 0.5) % len(COLOR_SCHEMES[self.instrument])

    def get_wave_position(self, x: float) -> float:
        """Calculate wave position at given x coordinate"""
        return self.amplitude * math.sin(self.frequency * x + self.phase)

class TextSymphonyWorld:
    def __init__(self):
        self.console = Console()
        self.term = Terminal()
        self.streams: List[TextStream] = []
        self.tempo = 120  # BPM
        self.beat_phase = 0
        self.running = True
        self.width = self.term.width
        self.height = self.term.height
        
        # Initialize streams for each instrument
        for i, instrument in enumerate(['strings', 'percussion', 'wind', 'synth', 'bass']):
            self.streams.append(TextStream(instrument, i))

    def create_title(self) -> Text:
        """Create the animated title"""
        title = pyfiglet.figlet_format("Text Symphony", font="slant")
        lines = title.split('\n')
        
        # Apply rainbow colors to title
        colored_title = Text()
        for i, line in enumerate(lines):
            if line.strip():
                hue = (time.time() * 50 + i * 20) % 360
                color = f"color({int(hue)})"
                colored_title.append(line + '\n', style=color)
        
        return colored_title

    def render_stream(self, stream: TextStream, width: int, height: int) -> List[Text]:
        """Render a single text stream"""
        lines = []
        colors = COLOR_SCHEMES[stream.instrument]
        patterns = PATTERNS[stream.pattern]
        
        # Calculate vertical position based on stream index
        base_y = int((stream.index + 1) * height / (len(self.streams) + 1))
        
        for x in range(width):
            # Calculate wave position
            y_offset = stream.get_wave_position(x)
            y = base_y + int(y_offset)
            
            if 0 <= y < height:
                # Select character and color
                char_index = int((x + self.beat_phase * 10) / 5) % len(patterns)
                char = patterns[char_index]
                
                # Interpolate color
                color_index = int(stream.color_index)
                color = colors[color_index % len(colors)]
                
                # Create text with position
                if y >= len(lines):
                    lines.extend([Text() for _ in range(y - len(lines) + 1)])
                
                # Add character at position with trailing effect
                intensity = 1.0 - (x / width) * 0.3
                dim_color = self.dim_color(color, intensity)
                lines[y].append(' ' * (x - len(lines[y].plain)) + char, style=dim_color)
        
        return lines

    def dim_color(self, color: str, intensity: float) -> str:
        """Dim a color by intensity factor"""
        if color.startswith('#'):
            # Parse hex color
            r = int(color[1:3], 16)
            g = int(color[3:5], 16)
            b = int(color[5:7], 16)
            
            # Apply intensity
            r = int(r * intensity)
            g = int(g * intensity)
            b = int(b * intensity)
            
            return f"#{r:02x}{g:02x}{b:02x}"
        return color

    def create_info_panel(self) -> Panel:
        """Create information panel with current stats"""
        beat = int(self.beat_phase * 4) % 4 + 1
        tempo_indicator = "♪ " * beat + "  " * (4 - beat)
        
        info_text = Text()
        info_text.append("╔══════════════════════════════════════╗\n", style="bright_cyan")
        info_text.append("║  ", style="bright_cyan")
        info_text.append("TEXT SYMPHONY WORLD", style="bold bright_yellow")
        info_text.append("  ║\n", style="bright_cyan")
        info_text.append("╚══════════════════════════════════════╝\n", style="bright_cyan")
        info_text.append(f"\nTempo: {self.tempo} BPM  {tempo_indicator}\n", style="bright_white")
        info_text.append(f"Streams: {len(self.streams)}\n", style="bright_white")
        info_text.append("\nInstruments:\n", style="bright_magenta")
        
        for stream in self.streams:
            color = COLOR_SCHEMES[stream.instrument][int(stream.color_index) % len(COLOR_SCHEMES[stream.instrument])]
            info_text.append(f"  ▸ {stream.instrument.capitalize()}", style=color)
            info_text.append(f" [{stream.pattern}]\n", style="dim")
        
        info_text.append("\nControls:\n", style="bright_cyan")
        info_text.append("  [Space] Pause/Resume\n", style="white")
        info_text.append("  [↑/↓] Adjust Tempo\n", style="white")
        info_text.append("  [Q] Quit\n", style="white")
        
        return Panel(info_text, border_style="bright_blue", title="[bold]Info[/bold]")

    def compose_frame(self) -> Layout:
        """Compose the complete frame"""
        layout = Layout()
        
        # Create main display area
        display = Text()
        display_lines = [Text() for _ in range(self.height - 10)]
        
        # Render each stream
        for stream in self.streams:
            stream_lines = self.render_stream(stream, self.width - 4, len(display_lines))
            
            # Merge stream lines into display
            for i, line in enumerate(stream_lines):
                if i < len(display_lines) and line.plain.strip():
                    display_lines[i].append(line)
        
        # Convert to single text
        for line in display_lines:
            if not line.plain.strip():
                display.append(' ' * (self.width - 4) + '\n')
            else:
                display.append(line)
                display.append('\n')
        
        # Create layout
        layout.split_column(
            Layout(Panel(self.create_title(), border_style="bright_magenta"), size=8),
            Layout(Panel(display, border_style="bright_green", title="[bold]Symphony[/bold]")),
            Layout(self.create_info_panel(), size=15)
        )
        
        return layout

    async def update_animation(self):
        """Main animation loop"""
        last_time = time.time()
        
        with Live(self.compose_frame(), console=self.console, refresh_per_second=30) as live:
            while self.running:
                current_time = time.time()
                dt = current_time - last_time
                last_time = current_time
                
                # Update beat phase
                self.beat_phase += (self.tempo / 60) * dt
                
                # Update all streams
                for stream in self.streams:
                    stream.update(dt)
                
                # Update display
                live.update(self.compose_frame())
                
                await asyncio.sleep(1/30)  # 30 FPS

    async def handle_input(self):
        """Handle keyboard input"""
        while self.running:
            with self.term.cbreak():
                key = self.term.inkey(timeout=0.1)
                
                if key.lower() == 'q':
                    self.running = False
                elif key.name == 'KEY_UP':
                    self.tempo = min(200, self.tempo + 10)
                elif key.name == 'KEY_DOWN':
                    self.tempo = max(60, self.tempo - 10)
                elif key == ' ':
                    # Pause/resume
                    await asyncio.sleep(0.1)

    async def run(self):
        """Run the text symphony world"""
        self.console.clear()
        
        # Run animation and input handling concurrently
        await asyncio.gather(
            self.update_animation(),
            self.handle_input()
        )

def main():
    """Entry point"""
    console.print("\n[bold bright_cyan]Welcome to Text Symphony World![/bold bright_cyan]\n")
    console.print("[bright_yellow]Initializing your terminal orchestra...[/bright_yellow]\n")
    time.sleep(1)
    
    try:
        world = TextSymphonyWorld()
        asyncio.run(world.run())
    except KeyboardInterrupt:
        pass
    finally:
        console.clear()
        console.print("\n[bold bright_magenta]Thank you for visiting Text Symphony World![/bold bright_magenta]\n")
        console.print("[dim]The symphony fades into silence...[/dim]\n")

if __name__ == "__main__":
    main()