#!/usr/bin/env python3
"""Assembles index.html (open locally) and artifact.html (page fragment for publishing) from src/."""
import os
here=os.path.dirname(os.path.abspath(__file__)); src=os.path.join(here,'src')
rd=lambda n: open(os.path.join(src,n),encoding='utf-8').read()
body=rd('body.html').replace('{{WORDMARK}}',rd('_wordmark.svg')).replace('{{MONO}}',rd('_mono.svg')).replace('{{PRIVACY}}',rd('_privacy.html'))
head='''<title>Vagari Vati</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400;500&family=JetBrains+Mono:wght@700&family=UnifrakturMaguntia&display=swap">
<style>
'''+rd('styles.css')+'''</style>
'''
tail='<script src="data.js"></script>\n<script>\n'+rd('app.js')+'</script>\n'
open(os.path.join(here,'artifact.html'),'w',encoding='utf-8').write(head+body+tail)
open(os.path.join(here,'index.html'),'w',encoding='utf-8').write('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'+head+'</head>\n<body>\n'+body+tail+'</body>\n</html>\n')
print('built')
