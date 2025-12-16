const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

/**
 * GET /api/legal/privacy-policy
 * Retorna a política de privacidade em HTML
 */
router.get('/privacy-policy', (req, res) => {
  try {
    const privacyPath = path.join(__dirname, '../legal/privacy-policy.md');
    
    if (!fs.existsSync(privacyPath)) {
      return res.status(404).json({ 
        error: 'Política de privacidade não encontrada' 
      });
    }

    const markdown = fs.readFileSync(privacyPath, 'utf8');
    
    // Converter markdown básico para HTML
    let html = markdown
      // Títulos
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      // Negrito
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      // Listas
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      // Parágrafos (linhas que não são títulos ou listas)
      .split('\n')
      .map(line => {
        if (line.trim() === '') return '';
        if (line.startsWith('<h') || line.startsWith('<li>') || line.startsWith('</ul>')) {
          return line;
        }
        if (line.startsWith('<li>')) {
          return line;
        }
        if (!line.trim().startsWith('<')) {
          return `<p>${line}</p>`;
        }
        return line;
      })
      .join('\n')
      // Agrupar listas
      .replace(/(<li>.*<\/li>\n?)+/gim, (match) => {
        return '<ul>' + match.replace(/\n/g, '') + '</ul>';
      });

    res.json({ content: html });
  } catch (error) {
    console.error('Erro ao ler política de privacidade:', error);
    res.status(500).json({ error: 'Erro ao carregar política de privacidade' });
  }
});

/**
 * GET /api/legal/terms-of-use
 * Retorna os termos de uso em HTML
 */
router.get('/terms-of-use', (req, res) => {
  try {
    const termsPath = path.join(__dirname, '../legal/terms-of-use.md');
    
    if (!fs.existsSync(termsPath)) {
      return res.status(404).json({ 
        error: 'Termos de uso não encontrados' 
      });
    }

    const markdown = fs.readFileSync(termsPath, 'utf8');
    
    // Converter markdown básico para HTML
    let html = markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .split('\n')
      .map(line => {
        if (line.trim() === '') return '';
        if (line.startsWith('<h') || line.startsWith('<li>') || line.startsWith('</ul>')) {
          return line;
        }
        if (!line.trim().startsWith('<')) {
          return `<p>${line}</p>`;
        }
        return line;
      })
      .join('\n')
      .replace(/(<li>.*<\/li>\n?)+/gim, (match) => {
        return '<ul>' + match.replace(/\n/g, '') + '</ul>';
      });

    res.json({ content: html });
  } catch (error) {
    console.error('Erro ao ler termos de uso:', error);
    res.status(500).json({ error: 'Erro ao carregar termos de uso' });
  }
});

module.exports = router;

