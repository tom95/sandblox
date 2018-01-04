```
{
	"materials": [
		{"color": "0xff0000", "texture": "wall.jpg", "id": "material1id"},
		{"color": "0xffffff", "texture": "roof.png", "id": "material2id"}
	],
	"blocks": [
		{
			"material": "material1id",
			"position": [0, 0, 0],
			"rotation": 0, /* 0, 90, 180, 270 */
			"block": "castle/wall",
			"id": "someidstring"
		},
		{
			"material": "material2id",
			"position": [10, 0, 0],
			"rotation": 90,
			"block": "castle/roof",
			"id": "someotheridstring"
		},
		{
			"material": ["material1id", "material2id"], /* multi-material objects, applied in the order of appearance in the source gltf */
			"position": [5, 0, 0],
			"rotation": 0,
			"block": "castle/door",
			"id": "somenewidstring"
		},
	],
	"environment": {
		"exposure": 1.4,
		"ambientOcclusion": "0.4"
	},
}
```
