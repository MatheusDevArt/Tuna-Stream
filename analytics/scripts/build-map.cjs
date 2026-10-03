const fs = require('node:fs');
const states = [
 ['11','RO','Rondônia',-63.9,-10.8],['12','AC','Acre',-70.4,-9.2],['13','AM','Amazonas',-64.5,-4],['14','RR','Roraima',-61.1,2],['15','PA','Pará',-53,-4],['16','AP','Amapá',-51.8,1.2],['17','TO','Tocantins',-48.2,-10.2],['21','MA','Maranhão',-45,-5],['22','PI','Piauí',-42.8,-7.6],['23','CE','Ceará',-39.5,-5],['24','RN','Rio Grande do Norte',-36.7,-5.8],['25','PB','Paraíba',-36.6,-7.1],['26','PE','Pernambuco',-37.6,-8.3],['27','AL','Alagoas',-36.5,-9.6],['28','SE','Sergipe',-37.5,-10.6],['29','BA','Bahia',-41.7,-12.8],['31','MG','Minas Gerais',-44.6,-18.8],['32','ES','Espírito Santo',-40.5,-19.8],['33','RJ','Rio de Janeiro',-42.6,-22.2],['35','SP','São Paulo',-48.4,-22.2],['41','PR','Paraná',-51.6,-24.5],['42','SC','Santa Catarina',-50.5,-27.2],['43','RS','Rio Grande do Sul',-53,-30.4],['50','MS','Mato Grosso do Sul',-54.8,-20.7],['51','MT','Mato Grosso',-56.2,-13],['52','GO','Goiás',-49.6,-16.2],['53','DF','Distrito Federal',-47.8,-15.8],
];
const geo = JSON.parse(fs.readFileSync('src/geo/brazil-source.geojson', 'utf8').replace(/^\uFEFF/, ''));
if (geo.features.length !== 27) throw new Error('Expected 27 Brazilian federative units');
const project = ([longitude, latitude]) => [24 + (longitude + 74) * 8.7, 22 + (5.4 - latitude) * 8.7];
const paths = geo.features.map(feature => {
 const metadata = states.find(state => state[0] === String(feature.properties.codarea));
 if (!metadata) throw new Error('Unknown state');
 const polygons = feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [feature.geometry.coordinates];
 const path = polygons.map(polygon => polygon.map(ring => ring.map((point,index) => (index ? 'L' : 'M') + project(point).map(value => value.toFixed(1)).join(',')).join('') + 'Z').join('')).join('');
 return {code:metadata[0],abbr:metadata[1],name:metadata[2],point:project([metadata[3],metadata[4]]).map(value => Number(value.toFixed(1))),path};
});
fs.writeFileSync('src/geo/brazil-map.json', JSON.stringify(paths));
console.log(JSON.stringify({states:paths.length,bytes:fs.statSync('src/geo/brazil-map.json').size,source:'IBGE Malhas v3'}));
