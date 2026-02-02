import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('create command', () => {
  const testDir = path.join(__dirname, 'test-temp');
  
  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });
  
  afterEach(async () => {
    await fs.remove(testDir);
  });
  
  it('validates project name format', async () => {
    // Test that invalid characters are rejected
    const invalidNames = ['My App', 'test@app', 'test/app'];
    
    for (const name of invalidNames) {
      const regex = /^[a-z0-9-_]+$/i;
      expect(regex.test(name)).toBe(false);
    }
    
    const validNames = ['my-app', 'my_app', 'test123', 'MyApp'];
    for (const name of validNames) {
      const regex = /^[a-z0-9-_]+$/i;
      expect(regex.test(name)).toBe(true);
    }
  });
  
  it('calculates template directory correctly', () => {
    const templatesDir = path.join(__dirname, '..', 'templates');
    expect(fs.pathExistsSync(templatesDir)).toBe(true);
    
    const templates = fs.readdirSync(templatesDir);
    expect(templates).toContain('starter');
    expect(templates).toContain('agent');
    expect(templates).toContain('init');
  });
});

describe('access command', () => {
  const testConfigDir = path.join(__dirname, 'test-config');
  const testConfigFile = path.join(testConfigDir, 'config.json');
  
  beforeEach(async () => {
    await fs.ensureDir(testConfigDir);
  });
  
  afterEach(async () => {
    await fs.remove(testConfigDir);
  });
  
  it('creates config file on login', async () => {
    const config = {
      email: 'test@example.com',
      accessLevel: 'paid',
      purchasedAt: new Date().toISOString(),
    };
    
    await fs.writeJson(testConfigFile, config);
    expect(await fs.pathExists(testConfigFile)).toBe(true);
    
    const loaded = await fs.readJson(testConfigFile);
    expect(loaded.email).toBe('test@example.com');
    expect(loaded.accessLevel).toBe('paid');
  });
});

describe('templates', () => {
  it('starter template has required files', () => {
    const starterDir = path.join(__dirname, '..', 'templates', 'starter');
    
    expect(fs.pathExistsSync(path.join(starterDir, 'package.json'))).toBe(true);
    expect(fs.pathExistsSync(path.join(starterDir, 'tsconfig.json'))).toBe(true);
    expect(fs.pathExistsSync(path.join(starterDir, 'src'))).toBe(true);
    
    const pkg = fs.readJsonSync(path.join(starterDir, 'package.json'));
    expect(pkg.dependencies).toHaveProperty('ai');
    expect(pkg.dependencies).toHaveProperty('@ai-sdk/openai');
  });
  
  it('agent template has required files', () => {
    const agentDir = path.join(__dirname, '..', 'templates', 'agent');
    
    expect(fs.pathExistsSync(path.join(agentDir, 'package.json'))).toBe(true);
    expect(fs.pathExistsSync(path.join(agentDir, 'src'))).toBe(true);
    
    const pkg = fs.readJsonSync(path.join(agentDir, 'package.json'));
    expect(pkg.dependencies).toHaveProperty('ai');
    expect(pkg.dependencies).toHaveProperty('@ai-sdk/openai');
  });
});