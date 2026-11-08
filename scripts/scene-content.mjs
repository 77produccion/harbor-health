import assert from 'node:assert/strict';
import { createProcessor } from '@mdx-js/mdx';

const kinds = new Set(['product-hero', 'document-explorer', 'clinical-reader', 'consultation-builder', 'knowledge-provenance', 'professional-paths', 'questions', 'product-access']);
const slug = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function inline(node) {
  if (node.type === 'text') return node.value;
  if (node.type === 'strong' || node.type === 'emphasis') return node.children.map(inline).join('');
  if (node.type === 'break') return ' ';
  throw new Error(`Contenido inline no permitido: ${node.type}`);
}

/** Parse MDX as data. Never evaluates JSX, imports, expressions, or user code. */
export function parseScenes(body, site, locale) {
  const tree = createProcessor().parse(body);
  const scenes = [];
  const ids = new Set();
  for (const node of tree.children) {
    assert(node.type === 'mdxJsxFlowElement' && node.name === 'Scene', 'El cuerpo solo admite bloques Scene declarativos');
    const attributes = {};
    for (const attribute of node.attributes) {
      assert(attribute.type === 'mdxJsxAttribute' && ['id', 'kind', 'items'].includes(attribute.name), 'Atributo Scene no permitido');
      assert(typeof attribute.value === 'string', 'Scene solo admite atributos literales');
      assert(!Object.hasOwn(attributes, attribute.name), 'Atributo Scene duplicado');
      attributes[attribute.name] = attribute.value;
    }
    assert(slug.test(attributes.id) && !ids.has(attributes.id), 'ID de Scene inválido o duplicado');
    assert(kinds.has(attributes.kind), 'Tipo de Scene desconocido');
    ids.add(attributes.id);
    const itemIds = attributes.items ? attributes.items.split(',') : [];
    assert(itemIds.every(id => slug.test(id)) && new Set(itemIds).size === itemIds.length, 'IDs de items inválidos');
    const scene = { id: attributes.id, kind: attributes.kind, title: '', paragraphs: [], actions: [], items: [] };
    let item;
    for (const child of node.children) {
      if (child.type === 'heading') {
        const title = child.children.map(inline).join('').trim();
        assert(title, 'Encabezado vacío');
        if (!scene.title) {
          assert(child.depth === (attributes.kind === 'product-hero' ? 1 : 2), 'Nivel de título de Scene inválido');
          scene.title = title;
        } else {
          assert(child.depth === 3, 'Los items de Scene deben ser h3');
          const id = itemIds[scene.items.length];
          assert(id, 'Cada h3 requiere un ID explícito en items');
          item = { id, title, paragraphs: [], actions: [] };
          scene.items.push(item);
        }
      } else if (child.type === 'paragraph') {
        assert(scene.title, 'Scene requiere título antes del texto');
        const target = item ?? scene;
        if (child.children.length === 1 && child.children[0].type === 'link') {
          const link = child.children[0];
          assert(link.url.startsWith('action:'), 'Los enlaces de Scene deben usar action:ID');
          const id = link.url.slice(7);
          assert(Object.hasOwn(site.actions, id), `Acción desconocida: ${id}`);
          assert(link.children.map(inline).join('') === site.actions[id].labels[locale], `Etiqueta distinta del catálogo: ${id}`);
          assert(!target.actions.includes(id), 'Acción duplicada');
          target.actions.push(id);
        } else {
          const value = child.children.map(inline).join('').replace(/\s+/g, ' ').trim();
          assert(value, 'Párrafo vacío');
          target.paragraphs.push(value);
        }
      } else {
        throw new Error(`Nodo no permitido en Scene: ${child.type}`);
      }
    }
    assert(scene.title && scene.paragraphs.length, 'Scene requiere título y texto');
    assert(scene.items.length === itemIds.length, 'La lista items no coincide con los h3');
    assert(scene.items.every(item => item.paragraphs.length), 'Cada item requiere texto');
    const contracts = {
      'document-explorer': ['laboratory', 'radiology', 'functional'],
      'clinical-reader': ['l1', 'l2'],
      'consultation-builder': ['context', 'followup', 'preparation'],
      'knowledge-provenance': ['origin', 'review', 'publication'],
      'professional-paths': ['reader', 'editor'],
    };
    if (contracts[scene.kind]) assert.deepEqual(itemIds, contracts[scene.kind], `Items fuera del contrato de ${scene.kind}`);
    if (scene.kind === 'questions') assert(scene.items.length > 0 && scene.items.length <= 8, 'FAQ requiere entre una y ocho respuestas');
    scenes.push(scene);
  }
  assert(scenes.length && scenes[0].kind === 'product-hero', 'La primera Scene debe ser product-hero');
  assert(scenes.filter(scene => scene.kind === 'product-hero').length === 1, 'Solo un hero');
  const journey = scenes.map((scene, i) => ['documents', 'levels', 'consultation'].includes(scene.id) ? i : -1).filter(i => i >= 0);
  assert(journey.length === 3 && journey[1] === journey[0] + 1 && journey[2] === journey[1] + 1, 'El recorrido de producto requiere tres escenas consecutivas');
  assert(scenes.at(-1).kind === 'product-access', 'El cierre debe ser la última escena');
  return scenes;
}

export function projectSceneSections(scenes) {
  return scenes.map(scene => {
    const actions = [...new Set([...scene.actions, ...scene.items.flatMap(item => item.actions)])];
    return ({
    id: scene.id,
    type: scene.kind === 'product-hero' ? 'hero' : scene.kind === 'questions' ? 'faq' : 'prose',
    title: scene.title,
    text: scene.paragraphs.join('\n\n'),
    ...(scene.items.length ? { items: scene.items.map(item => ({ id: item.id, title: item.title, text: item.paragraphs.join('\n\n') })) } : {}),
    ...(actions.length ? { actions } : {}),
  }); });
}
