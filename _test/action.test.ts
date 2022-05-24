import extensions from '../';

const StarWarsAction = extensions['actions']['star-wars']['character'];

test('lists fild with defined ID', async () => {
  const response = await StarWarsAction({ method: 'GET', path: '/', query: { search: 'Obi' } });

  const result = JSON.parse(response.body);
  console.log(result);
  expect(result.data.allPeople.totalCount).toBe(1);
  expect(result.data.allPeople.people[0].name).toBe('Obi-Wan Kenobi');
});

export {};
