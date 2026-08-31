# Cosmic V2 Design System

## Real brand identities

Real brand identities use official brand assets. Cosmic styling is applied to the surrounding interface, not by recreating third-party logos. Provider marks must come from the provider’s official brand/developer resources, retain their approved geometry and colors, and remain inside a Cosmic button or connection surface without implying endorsement.

Version 1.0
Last Updated: June 30, 2026

---

# Philosophy

Cosmic is not a website.

Cosmic is not an operating system.

Cosmic is a Personal Operating Environment (POE).

Every application should feel like it belongs inside one cohesive environment.

Design should communicate information—not decoration.

---

# Core Principles

## 1. Information First

The most important information should always receive the most visual attention.

Never make users search for the answer.

Examples:

Weather
- Temperature is primary.
- Forecast is secondary.
- Metadata is tertiary.

Sports
- Score is primary.
- Game state is secondary.
- Statistics are tertiary.

---

## 2. Calm Interfaces

Avoid visual noise.

Every element should have a purpose.

Whitespace is a design tool.

---

## 3. One Visual Language

Every application should feel related.

Weather.

Sports.

Garage.

Assistant.

School.

Music.

Settings.

All should look like members of the same family.

---

## 4. Functional Beauty

Design decisions should improve usability.

Never add decoration that doesn't communicate information.

---

# Layout

Applications follow this order:

Hero

↓

Primary Information

↓

Secondary Information

↓

Supporting Information

↓

Metadata

---

# Cards

Cards should be used sparingly.

Avoid "cards inside cards."

Cards should group information—not replace layout.

---

# Typography

Hero Numbers

Very Large

Heavy

Examples:

72°

3–2

12:45

---

Section Titles

Medium

Bold

Examples:

Hourly Forecast

Last Game

Garage Status

Projects

---

Metadata

Small

Low opacity

Examples:

Updated 2:41 PM

Coalville, UT

June 30, 2026

---

# Colors

Glass

Used for surfaces.

Never solid backgrounds.

---

Green

Success

Live

Connected

Healthy

---

Yellow

Warning

Pregame

Pending

Loading

---

Blue

Informational

Scheduled

Completed

Neutral status

---

Red

Critical

Delayed

Offline

Errors

---

# Motion

Animations should communicate state.

Never distract.

Open windows

200–250ms

Hover

150ms

Status changes

Fade

Data refresh

Invisible

---

# Spacing

Base spacing

8px

Card padding

20–24px

Section spacing

32px

Application padding

32px

---

# Icons

Icons communicate.

Never decorate.

Emoji may be used during development.

Production applications should use SVG icons.

Sports should use official team logos.

---

# Data Hierarchy

Always ask:

What is the user looking for?

Example:

Sports

1 Score

2 Game State

3 Inning

4 Count

5 Bases

6 Statistics

Never reverse that order.

---

# Cosmic Standard

Every feature should answer three questions.

1.

Does it solve a real problem?

2.

Is this the simplest way to present the information?

3.

Does it feel like it belongs inside Cosmic?


# 🌌 Cosmic Design System
Version: 1.0
Project: Cosmic
Last Updated: July 2026

---

# Philosophy

Cosmic is not a website.

Cosmic is a desktop operating system.

Every interaction should feel intentional, premium, and calm.

Design inspiration comes from:

- visionOS
- Apple Weather
- Arc Browser
- Nothing OS
- Linear
- Raycast

The goal is not to copy any one product.

The goal is to create a cohesive operating system with its own identity.

---

# Design Principles

## 1. Calm

Nothing should fight for attention.

Motion is subtle.

Colors are soft.

Spacing is generous.

---

## 2. Information First

Every widget answers a question.

Weather
→ Should I take a jacket?

Garage
→ Is my car okay?

Calendar
→ Am I busy today?

Sports
→ Is my team playing?

---

## 3. Reusable Systems

Never build one-off components.

Always ask:

Can this become reusable?

Examples:

✓ Weather primitives

✓ WidgetCard

✓ GlassPanel

✓ AppShell

✓ Button

---

## 4. Consistency

Every app should feel like it belongs to the same operating system.

Never redesign the same pattern twice.

---

# Layout

Dashboard uses a 12-column grid.

Widgets snap to this grid.

Standard spacing:

24px

Large spacing:

40px

Card padding:

24px

App padding:

32px

---

# Border Radius

Cards

24px

Buttons

18px

Inputs

18px

Launcher

28px

Never use sharp corners.

---

# Glass

Standard Glass Panel

Background

white / 4%

Border

white / 10%

Blur

24px

Hover

white / 8%

Shadow

0 8px 32px rgba(0,0,0,.35)

---

# Typography

Font

Geist

---

Page Title

48–56px

Bold

---

Widget Title

12px

Uppercase

Letter spacing:

0.3em

Opacity:

50%

---

Primary Value

32–64px

Bold

---

Supporting Text

16px

Opacity:

60%

---

Muted Text

14px

Opacity:

40%

---

# Colors

Dark Theme First

Primary Background

Near Black

Glass

White 4%

Borders

White 10%

Primary Text

White

Secondary

White 60%

Muted

White 40%

Accent

Sky Blue

---

# Motion

Motion should never attract attention.

It should reinforce interaction.

Preferred duration

150–250ms

Hover

Scale

1.01

Maximum

1.03

Never bounce.

Never overshoot.

Never use elastic animations.

---

# Weather

Weather uses its own icon system.

Folder

components/icons/weather

Icons are built from reusable primitives.

Sun

Moon

Cloud

Stars

Rain

Lightning

Snow

Wind

Scenes compose primitives.

---

# Cosmic Glyphs

The operating system uses its own glyph library.

Folder

components/icons/cosmic

ViewBox

64x64

Stroke Width

2.75

Linecap

Round

Linejoin

Round

Padding

8px

Static first.

Animation later.

---

# Buttons

Buttons should feel soft.

Hover

Slight lift

Slight brighten

Press

Scale 0.99

Never bounce.

---

# Widgets

Every widget follows the same hierarchy.

1.

Section Label

2.

Primary Content

3.

Supporting Content

4.

Status

Widgets answer one question.

Apps answer everything.

---

# Launcher

⌘K

Opens Cosmic Launcher.

Launcher is the primary navigation system.

Eventually supports:

Apps

Commands

Files

Settings

AI

---

# Sidebar

Sidebar displays applications.

Eventually uses Cosmic Glyphs.

No emoji after v1.

---

# Dashboard Philosophy

The Dashboard is the home screen.

It should answer:

What time is it?

What's the weather?

What's next?

Anything important?

The Dashboard should be glanceable in under five seconds.

---

# Architecture

Every feature follows the same pattern.

Service

↓

Store

↓

Hook

↓

View

Views never fetch data directly.

---

# Component Rules

If a component can be reused:

Extract it.

If two components look the same:

Share them.

If logic is duplicated:

Move it.

---

# Definition of Done

A feature is complete when:

✓ No placeholder text

✓ Uses shared components

✓ Uses shared design language

✓ Uses shared architecture

✓ Handles loading

✓ Handles empty state

✓ Handles errors

Only then is it considered finished.

---

# Future

After v1:

Window Manager

Themes

Dock

Voice

AI

Particles

Wallpaper Engine

Cosmic Glyph Animations

Weather Engine V2
