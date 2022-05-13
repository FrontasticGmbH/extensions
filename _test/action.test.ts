import extensions from '../';

const StarWarsAction = extensions['actions']['star-wars']['character'];

test('lists fild with defined ID', async () => {
  const response = await StarWarsAction(
    { method: "GET", path: "/", query: { search: "Obi" } },
    {}
  );

  const result = JSON.parse(response.body)

  expect(result.count).toBe(1);
  expect(result.results[0].name).toBe("Obi-Wan Kenobi");
});

export { }
